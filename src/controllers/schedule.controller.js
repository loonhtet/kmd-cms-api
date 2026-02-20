import { prisma } from "../config/db.js";
import paginate from "../utils/pagination.js";

const getSchedules = async (req, res) => {
  try {
    const { studentId, tutorId, type, isCompleted } = req.query;

    const whereClause = {
      ...(studentId && { studentId }),
      ...(tutorId && { tutorId }),
      ...(type && { type: type.toUpperCase() }),
      ...(isCompleted !== undefined && { isCompleted: isCompleted === "true" }),
    };

    const result = await paginate(prisma.schedule, req, {
      where: whereClause,
      select: {
        id: true,
        title: true,
        type: true,
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
    });

    res.status(200).json({
      status: "success",
      data: result.data,
      meta: result.meta,
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

    await prisma.schedule.create({
      data: {
        studentId,
        tutorId,
        title,
        type,
        date: new Date(date),
        startTime: new Date(`1970-01-01T${startTime}:00.000Z`),
        endTime: new Date(`1970-01-01T${endTime}:00.000Z`),
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
    });

    if (!scheduleExists) {
      return res.status(404).json({
        status: "error",
        message: "Schedule not found",
      });
    }

    const updateData = {
      ...(title && { title }),
      ...(type && { type }),
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

    await prisma.schedule.update({
      where: { id },
      data: updateData,
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
