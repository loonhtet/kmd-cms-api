import { prisma } from "../config/db.js";

export const getTutorDashboard = async (req, res) => {
  try {
    const userId = "f9e201a3-3ea0-4466-a91d-e680b67e9a1b";
    // const userId = req.user.id;

    const tutor = await prisma.tutor.findUnique({
      where: { userId }
    });
    console.log("Tutor found:", tutor);

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
          receiverId: userId
        }
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
      getWeeklyStats(tutor.id),

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


const getWeeklyStats = async (tutorId) => {
  const now = new Date();

  // last 5 weeks
  const start = new Date();
  start.setDate(now.getDate() - 35);

  const schedules = await prisma.schedule.findMany({
    where: {
      tutorId,
      date: { gte: start }
    }
  });

  // initialize fixed structure
  const result = {
    week1: [0, 0],
    week2: [0, 0],
    week3: [0, 0],
    week4: [0, 0],
    week5: [0, 0]
  };

  schedules.forEach((s) => {
    const diffDays = Math.floor((now - new Date(s.date)) / (1000 * 60 * 60 * 24));
    const weekIndex = 4 - Math.floor(diffDays / 7); // map to week1 → week5

    if (weekIndex >= 0 && weekIndex < 5) {
      const key = `week${weekIndex + 1}`;

      if (s.isCompleted) {
        result[key][0] += 1; // completed
      } else {
        result[key][1] += 1; // scheduled
      }
    }
  });

  return result;
};


const getActivityTrends = async (tutorId) => {
  const now = new Date();
  const start = new Date();
  start.setDate(now.getDate() - 35);

  const [meetings, documents, blogs] = await Promise.all([
    prisma.schedule.findMany({
      where: { tutorId, createdAt: { gte: start } }
    }),
    prisma.document.findMany({
      where: { tutorId, createdAt: { gte: start } }
    }),
    prisma.blog.findMany({
      where: { createdAt: { gte: start } }
    })
  ]);

  const result = {
    week1: [0, 0, 0],
    week2: [0, 0, 0],
    week3: [0, 0, 0],
    week4: [0, 0, 0],
    week5: [0, 0, 0]
  };

  const process = (items, index) => {
    items.forEach((item) => {
      const diffDays = Math.floor((now - new Date(item.createdAt)) / (1000 * 60 * 60 * 24));
      const weekIndex = 4 - Math.floor(diffDays / 7);

      if (weekIndex >= 0 && weekIndex < 5) {
        const key = `week${weekIndex + 1}`;
        result[key][index] += 1;
      }
    });
  };

  process(meetings, 0);   // meetings
  process(documents, 1);  // documents
  process(blogs, 2);      // blogs

  return result;
};