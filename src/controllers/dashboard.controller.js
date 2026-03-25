import { prisma } from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalTutors, assignedStudents, unassignedStudents] =
      await prisma.$transaction([
        prisma.student.count(),

        prisma.tutor.count(),

        prisma.student.count({
          where: {
            NOT: { tutorId: null },
          },
        }),

        prisma.student.count({
          where: {
            tutorId: null,
          },
        }),
      ]);

    res.status(200).json({
      success: "success",
      stats: {
        totalStudents,
        totalTutors,
        assignedStudents,
        unassignedStudents,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: "error",
      message: "Failed to fetch dashboard statistics.",
    });
  }
};
