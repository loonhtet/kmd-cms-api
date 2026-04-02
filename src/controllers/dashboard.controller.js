import { prisma } from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [
      [totalStudents, totalTutors, assignedStudents, unassignedStudents],
      chartRows,
    ] = await Promise.all([
      prisma.$transaction([
        prisma.student.count(),
        prisma.tutor.count(),
        prisma.student.count({ where: { NOT: { tutorId: null } } }),
        prisma.student.count({ where: { tutorId: null } }),
      ]),
      prisma.$queryRaw`
          SELECT
            'week' || ROW_NUMBER() OVER (ORDER BY week_start) AS week_key,
            COUNT(*)::int                                      AS scheduled,
            COUNT(*) FILTER (WHERE "isCompleted" IS TRUE)::int AS completed
          FROM (
            SELECT
              date,
              "isCompleted",
              DATE_TRUNC('week', date::timestamp) AS week_start
            FROM "Schedule"
            WHERE date >= DATE_TRUNC('week', NOW()) - INTERVAL '6 weeks'
            AND date < DATE_TRUNC('week', NOW()) + INTERVAL '1 week'
          ) sub
          GROUP BY week_start
          ORDER BY week_start
        `,
    ]);

    const weeklyStats = {};
    for (const row of chartRows) {
      weeklyStats[row.week_key] = [row.scheduled, row.completed];
    }

    res.status(200).json({
      success: "success",
      stats: {
        totalStudents,
        totalTutors,
        assignedStudents,
        unassignedStudents,
      },
      weeklyStats,
    });
  } catch (error) {
    res.status(500).json({
      success: "error",
      message: "Failed to fetch dashboard statistics.",
      error: error.message,
    });
  }
};
