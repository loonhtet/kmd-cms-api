import { prisma } from "../config/db.js";

export const getTutorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const tutor = await prisma.tutor.findUnique({
      where: { userId }
    });

    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    const now = new Date();

    // 📦 Run everything in parallel
    const [
      totalStudents,
      upcomingMeetings,
      totalDocuments,
      unreadMessages,
      nextMeeting,
      weeklyStats,
      activityTrends
    ] = await Promise.all([

      // 👨‍🎓 total students
      prisma.student.count({
        where: { tutorId: tutor.id }
      }),

      // 📅 upcoming meetings count
      prisma.schedule.count({
        where: {
          tutorId: tutor.id,
          date: { gte: now }
        }
      }),

      // 📄 documents
      prisma.document.count({
        where: { tutorId: tutor.id }
      }),

      // 💬 unread messages
      prisma.message.count({
          where: {
            receiverId: userId,
            isRead: false,
          },
        }),

      // 🕒 next meeting
      prisma.schedule.findFirst({
        where: {
          tutorId: tutor.id,
          date: { gte: now }
        },
        orderBy: {
          date: "asc"
        }
      }),

      // 📈 weekly stats
      getWeeklyMeetingStatisticsForTutor(tutor.id),

      // 📊 activity trends
      getActivityTrends(tutor.id)
    ]);

    res.json({
      cards: {
        totalStudents,
        upcomingMeetings,
        unreadMessages,
        totalDocuments
      },
      nextMeeting,
      weeklyStats,
      activityTrends
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Dashboard error" });
  }
};

export const getWeeklyMeetingStatisticsForTutor = async (tutorId) => {
  try {
    const chartRows = await prisma.$queryRaw`
      SELECT
        'week' || ROW_NUMBER() OVER (ORDER BY week_start) AS week_key,
        COUNT(*)::int AS scheduled,
        COUNT(*) FILTER (WHERE "isCompleted" IS TRUE)::int AS completed
      FROM (
        SELECT
          "date",
          "isCompleted",
          DATE_TRUNC('week', "date") AS week_start
        FROM "Schedule"
        WHERE date >= DATE_TRUNC('week', NOW()) - INTERVAL '6 weeks'
            AND date < DATE_TRUNC('week', NOW()) + INTERVAL '1 week'
          AND "tutorId" = ${tutorId}
      ) sub
      GROUP BY week_start
      ORDER BY week_start;
    `;

    const weeklyMeetingStatistics = {};

    for (const row of chartRows) {
      weeklyMeetingStatistics[row.week_key] = [
        row.completed,
        row.scheduled - row.completed, // notCompleted
      ];
    }

    return {
      status: "success",
      data: weeklyMeetingStatistics,
    };

  } catch (error) {
    return {
      status: "error",
      message: "Failed to fetch weekly meeting statistics",
      error: error.message,
    };
  }
};

export const getActivityTrends = async (tutorId) => {
  try {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - 42); // 7 weeks

    // align to start of week (Monday)
    start.setHours(0, 0, 0, 0);

    // ✅ get tutor userId (for blogs)
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      select: { userId: true },
    });

    if (!tutor) {
      return {
        status: "error",
        message: "Tutor not found",
      };
    }

    const userId = tutor.userId;

    // ✅ fetch minimal data (NOT full records)
    const [meetings, documents, blogs] = await Promise.all([
      prisma.schedule.findMany({
        where: {
          tutorId,
          date: { gte: start },
        },
        select: { date: true },
      }),
      prisma.document.findMany({
        where: {
          tutorId,
          createdAt: { gte: start },
        },
        select: { createdAt: true },
      }),
      prisma.blog.findMany({
        where: {
          userId,
          createdAt: { gte: start },
        },
        select: { createdAt: true },
      }),
    ]);

    // ✅ prepare 7 weeks
    const result = {};
    for (let i = 0; i < 7; i++) {
      result[`week${i + 1}`] = [0, 0, 0]; // [meetings, documents, blogs]
    }

    const getWeekIndex = (date) => {
      const diffDays = Math.floor((now - new Date(date)) / (1000 * 60 * 60 * 24));
      return 6 - Math.floor(diffDays / 7);
    };

    // ✅ process function
    const process = (items, index, field) => {
      items.forEach((item) => {
        const weekIndex = getWeekIndex(item[field]);

        if (weekIndex >= 0 && weekIndex < 7) {
          const key = `week${weekIndex + 1}`;
          result[key][index] += 1;
        }
      });
    };

    process(meetings, 0, "date");
    process(documents, 1, "createdAt");
    process(blogs, 2, "createdAt");

    return {
      status: "success",
      data: result,
    };

  } catch (error) {
    return {
      status: "error",
      message: "Failed to fetch activity trends",
      error: error.message,
    };
  }
};