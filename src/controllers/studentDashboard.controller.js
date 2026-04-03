import { prisma } from "../config/db.js";

const getUTCWeekStart = (date) => {
  const weekStart = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const day = weekStart.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  weekStart.setUTCDate(weekStart.getUTCDate() + diffToMonday);
  weekStart.setUTCHours(0, 0, 0, 0);

  return weekStart;
};

const getWeeklyMeetingStatistics = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );

    const student = await prisma.student.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student profile not found",
      });
    }

    const whereClause = {
      createdAt: {
        gte: monthStart,
        lt: nextMonthStart,
      },
      students: {
        some: { id: student.id },
      },
    };

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      select: {
        createdAt: true,
        isCompleted: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const weekBuckets = new Map();
    schedules.forEach(({ createdAt, isCompleted }) => {
      const weekStart = getUTCWeekStart(new Date(createdAt)).toISOString();

      if (!weekBuckets.has(weekStart)) {
        weekBuckets.set(weekStart, [0, 0]);
      }

      const counts = weekBuckets.get(weekStart);

      if (isCompleted) {
        counts[1] += 1;
      } else {
        counts[0] += 1;
      }
    });

    const weeklyMeetingStatistics = {};
    let weekNumber = 1;

    weekBuckets.forEach((counts) => {
      weeklyMeetingStatistics[`week${weekNumber}`] = counts;
      weekNumber += 1;
    });

    res.status(200).json({
      status: "success",
      data: weeklyMeetingStatistics,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch weekly meeting statistics",
      error: error.message,
    });
  }
};

const getStudentDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student profile not found",
      });
    }

    const now = new Date();

    const [upcomingMeetings, unreadMessages, documentsShared, completedSchedules] =
      await Promise.all([
        // Upcoming meetings: schedules with date >= now
        prisma.schedule.count({
          where: {
            students: { some: { id: student.id } },
            date: { gte: now },
          },
        }),

        // Unread messages: messages received by this user that are unread
        prisma.message.count({
          where: {
            receiverId: userId,
            isRead: false,
          },
        }),

        // Documents shared: total documents for this student
        prisma.document.count({
          where: { studentId: student.id },
        }),

        // Completed schedules with time info for meeting hours calculation
        prisma.schedule.findMany({
          where: {
            students: { some: { id: student.id } },
            isCompleted: true,
          },
          select: {
            startTime: true,
            endTime: true,
          },
        }),
      ]);

    // Calculate total meeting hours from completed schedules
    let totalMeetingMinutes = 0;
    completedSchedules.forEach(({ startTime, endTime }) => {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end.getTime() - start.getTime();
      if (diffMs > 0) {
        totalMeetingMinutes += diffMs / (1000 * 60);
      }
    });

    const meetingHours = Math.round(totalMeetingMinutes / 60);

    res.status(200).json({
      status: "success",
      data: {
        upcomingMeetings,
        unreadMessages,
        documentsShared,
        meetingHours,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch student dashboard statistics",
      error: error.message,
    });
  }
};

const getRecentMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const latestMessage = await prisma.message.findFirst({
      where: {
        receiverId: userId,
        isRead: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        isRead: true,
        User_Message_senderIdToUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!latestMessage) {
      return res.status(200).json({
        status: "success",
        data: null,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        id: latestMessage.id,
        senderName: latestMessage.User_Message_senderIdToUser.name,
        content: latestMessage.content,
        date: latestMessage.createdAt,
        isRead: latestMessage.isRead,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch recent messages",
      error: error.message,
    });
  }
};

export { getWeeklyMeetingStatistics, getStudentDashboardStats, getRecentMessages };
