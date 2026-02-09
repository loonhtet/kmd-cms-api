import { prisma } from "../config/db.js";

const assignStudentToTutor = async (req, res) => {
  try {
    const { studentId, tutorId } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student not found",
      });
    }

    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!tutor) {
      return res.status(404).json({
        status: "error",
        message: "Tutor not found",
      });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        tutorId: tutorId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: `Student ${student.user.name} assigned to tutor ${tutor.user.name}`,
      data: {
        studentId: updatedStudent.id,
        studentName: updatedStudent.user.name,
        tutorId: updatedStudent.tutor.id,
        tutorName: updatedStudent.tutor.user.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to assign student to tutor",
      error: error.message,
    });
  }
};

const unassignStudentFromTutor = async (req, res) => {
  try {
    const { studentId } = req.body;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student not found",
      });
    }

    if (!student.tutorId) {
      return res.status(400).json({
        status: "error",
        message: "Student is not assigned to any tutor",
      });
    }

    await prisma.student.update({
      where: { id: studentId },
      data: {
        tutorId: null,
      },
    });

    res.status(200).json({
      status: "success",
      message: `Student ${student.user.name} unassigned from tutor`,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to unassign student from tutor",
      error: error.message,
    });
  }
};

const getTutorWithStudents = async (req, res) => {
  try {
    const { userId } = req.params;

    const tutor = await prisma.tutor.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        students: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            user: {
              name: "asc",
            },
          },
        },
      },
    });

    if (!tutor) {
      return res.status(404).json({
        status: "error",
        message: "Tutor not found or user is not a tutor",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        tutorId: tutor.userId,
        tutorName: tutor.user.name,
        tutorEmail: tutor.user.email,
        tutorImage: tutor.user.image,
        studentCount: tutor.students.length,
        students: tutor.students.map((student) => ({
          userId: student.userId,
          name: student.user.name,
          email: student.user.email,
          image: student.user.image,
          assignedAt: student.updatedAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch tutor's students",
      error: error.message,
    });
  }
};

const getStudentWithTutor = async (req, res) => {
  try {
    const { userId } = req.params;

    const student = await prisma.student.findUnique({
      where: { userId: userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return res.status(404).json({
        status: "error",
        message: "Student not found or user is not a student",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        studentId: student.userId,
        studentName: student.user.name,
        studentEmail: student.user.email,
        studentImage: student.user.image,
        hasTutor: !!student.tutor,
        tutor: student.tutor
          ? {
              userId: student.tutor.userId,
              name: student.tutor.user.name,
              email: student.tutor.user.email,
              image: student.tutor.user.image,
              assignedAt: student.updatedAt,
            }
          : null,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch student's tutor",
      error: error.message,
    });
  }
};

export {
  assignStudentToTutor,
  unassignStudentFromTutor,
  getTutorWithStudents,
  getStudentWithTutor,
};
