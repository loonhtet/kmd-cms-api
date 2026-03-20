import { prisma } from "../config/db.js";
import paginate from "../utils/pagination.js";

const getSchedules = async (req, res) => {
  try {
    const { studentId, tutorId, type, isCompleted } = req.query;

    const validTypes = ["VIRTUAL", "IN_PERSON"];
    const normalizedType = type?.toUpperCase();

    const whereClause = {
      ...(studentId && { studentId }),
      ...(tutorId && { tutorId }),
      ...(normalizedType &&
        validTypes.includes(normalizedType) && { type: normalizedType }),
      ...(isCompleted !== undefined && { isCompleted: isCompleted === "true" }),
    };

    const [result, completedCount, pendingCount] = await Promise.all([
      paginate(prisma.schedule, req, {
        where: whereClause,
        select: {
          id: true,
          title: true,
          type: true,
          linkType: true,
          date: true,
          startTime: true,
          endTime: true,
          link: true,
          location: true,
          note: true,
          isCompleted: true,
          createdAt: true,
          updatedAt: true,
          student: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          tutor: {
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: "asc",
        },
      }),
      prisma.schedule.count({ where: { ...whereClause, isCompleted: true } }),
      prisma.schedule.count({ where: { ...whereClause, isCompleted: false } }),
    ]);

    res.status(200).json({
      status: "success",
      data: result.data,
      meta: {
        ...result.meta,
        completedCount,
        pendingCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch schedules",
      error: error.message,
    });
  }
};

const getSingleSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        type: true,
        linkType: true,
        date: true,
        startTime: true,
        endTime: true,
        link: true,
        location: true,
        note: true,
        isCompleted: true,
        createdAt: true,
        updatedAt: true,
        student: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        tutor: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!schedule) {
      return res.status(404).json({
        status: "error",
        message: "Schedule not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch schedule",
      error: error.message,
    });
  }
};

const createSchedule = async (req, res) => {
  try {
    const {
      studentId,
      tutorId,
      title,
      type,
      linkType,
      date,
      startTime,
      endTime,
      link,
      location,
      note,
    } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student not found",
      });
    }

    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
    });

    if (!tutor) {
      return res.status(404).json({
        status: "error",
        message: "Tutor not found",
      });
    }

    const parsedStartTime = new Date(`1970-01-01T${startTime}:00.000Z`);
    const parsedEndTime = new Date(`1970-01-01T${endTime}:00.000Z`);

    const conflict = await prisma.schedule.findFirst({
      where: {
        date: new Date(date),
        OR: [{ studentId }, { tutorId }],
        AND: [
          { startTime: { lt: parsedEndTime } },
          { endTime: { gt: parsedStartTime } },
        ],
      },
    });

    if (conflict) {
      return res.status(409).json({
        status: "error",
        message: "A schedule conflict exists for the selected time slot",
      });
    }

    await prisma.schedule.create({
      data: {
        studentId,
        tutorId,
        title,
        type,
        linkType: linkType || null,
        date: new Date(date),
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        link: link || null,
        location: location || null,
        note: note || null,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Schedule created successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create schedule",
      error: error.message,
    });
  }
};

const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      type,
      linkType,
      date,
      startTime,
      endTime,
      link,
      location,
      note,
      isCompleted,
    } = req.body;

    const scheduleExists = await prisma.schedule.findUnique({
      where: { id },
      include: {
        student: { select: { userId: true } },
        tutor: { select: { userId: true } },
      },
    });

    if (!scheduleExists) {
      return res.status(404).json({
        status: "error",
        message: "Schedule not found",
      });
    }

    const effectiveType = type ?? scheduleExists.type;
    const effectiveLinkType =
      linkType !== undefined ? linkType : scheduleExists.linkType;

    // Cross-validate type vs linkType
    if (effectiveType === "VIRTUAL" && !effectiveLinkType) {
      return res.status(400).json({
        status: "error",
        message: "Link type is required for virtual meetings",
      });
    }

    if (effectiveType === "IN_PERSON" && effectiveLinkType) {
      return res.status(400).json({
        status: "error",
        message: "Link type should not be provided for in-person meetings",
      });
    }

    const effectiveStartTime = startTime ?? scheduleExists.startTime;
    const effectiveEndTime = endTime ?? scheduleExists.endTime;

    const toMinutes = (t) => {
      if (t instanceof Date) {
        return t.getUTCHours() * 60 + t.getUTCMinutes();
      }
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    if (toMinutes(effectiveEndTime) <= toMinutes(effectiveStartTime)) {
      return res.status(400).json({
        status: "error",
        message: "End time must be after start time",
      });
    }

    const updateData = {
      ...(title && { title }),
      ...(type && { type }),
      // Allow linkType to be explicitly set to null (e.g. switching to IN_PERSON)
      ...(linkType !== undefined && { linkType: linkType || null }),
      ...(date && { date: new Date(date) }),
      ...(startTime && {
        startTime: new Date(`1970-01-01T${startTime}:00.000Z`),
      }),
      ...(endTime && { endTime: new Date(`1970-01-01T${endTime}:00.000Z`) }),
      ...(link !== undefined && { link: link || null }),
      ...(location !== undefined && { location: location || null }),
      ...(note !== undefined && { note: note || null }),
      ...(isCompleted !== undefined && { isCompleted }),
    };

    await prisma.$transaction(async (tx) => {
      await tx.schedule.update({
        where: { id },
        data: updateData,
      });

      if (isCompleted === true && !scheduleExists.isCompleted) {
        const scheduleDate = date ? new Date(date) : scheduleExists.date;

        await tx.user.updateMany({
          where: {
            id: {
              in: [scheduleExists.student.userId, scheduleExists.tutor.userId],
            },
          },
          data: { lastActive: scheduleDate },
        });
      }
    });

    res.status(200).json({
      status: "success",
      message: "Schedule updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update schedule",
      error: error.message,
    });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const scheduleExists = await prisma.schedule.findUnique({
      where: { id },
    });

    if (!scheduleExists) {
      return res.status(404).json({
        status: "error",
        message: "Schedule not found",
      });
    }

    await prisma.schedule.delete({
      where: { id },
    });

    res.status(200).json({
      status: "success",
      message: "Schedule deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete schedule",
      error: error.message,
    });
  }
};

export {
  getSchedules,
  getSingleSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
