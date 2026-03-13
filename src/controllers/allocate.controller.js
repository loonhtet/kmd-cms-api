import { prisma } from "../config/db.js";
import { sendEmail } from "../services/email.service.js";

const assignStudentToTutor = async (req, res) => {
  try {
    const { studentIds, tutorId } = req.body;

    // Verify tutor exists
    const tutor = await prisma.tutor.findUnique({
      where: { id: tutorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email:true
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

    // Verify all students exist
    const students = await prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        tutor: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // Check if all requested students were found
    if (students.length !== studentIds.length) {
      const foundIds = students.map((s) => s.id);
      const notFoundIds = studentIds.filter((id) => !foundIds.includes(id));

      return res.status(404).json({
        status: "error",
        message: "Some students not found",
        notFoundIds,
      });
    }

    // Check which students are already assigned to other tutors
    // const alreadyAssigned = students.filter(
    //   (student) => student.tutorId && student.tutorId !== tutorId,
    // );

    // Update all students to new tutor
    await prisma.student.updateMany({
      where: {
        id: {
          in: studentIds,
        },
      },
      data: {
        tutorId: tutorId,
      },
    });

    // Fetch updated students with full details
    const updatedStudents = await prisma.student.findMany({
      where: {
        id: {
          in: studentIds,
        },
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

     if (updatedStudents.length > 0) {
      for (const student of updatedStudents) {
        await prisma.conversation.create({
          data: {
            studentId: student.user.id,
            tutorId: tutor.user.id,
          },
        });
      }
    }

    // =========================
    // Send emails
    // =========================
   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      try {
        const studentNamesString = updatedStudents
          .map((s) => s.user.name)
          .join(", ");

        // Send emails to students sequentially
        for (const student of updatedStudents) {
          if (student.user.email) {
            console.log("Sending email to student:", student.user.email);
            await sendEmail({
              to: student.user.email,
              type: "student-assigned",
              variables: {
                studentName: student.user.name,
                tutorName: tutor.user.name,
                tutorEmail: tutor.user.email,
              },
            });
            await delay(600); // wait 0.6 second between each email
          }
        }

        // Send email to tutor after students
        if (tutor.user.email) {
          console.log("Sending email to tutor:", tutor.user.email);
          await sendEmail({
            to: tutor.user.email,
            type: "tutor-assigned",
            variables: {
              tutorName: tutor.user.name,
              studentNames: studentNamesString,
              studentCount: updatedStudents.length,
            },
          });
        }

      } catch (error) {
        console.error("Email sending failed:", error.message);
      }

    const studentNames = students.map((s) => s.user.name).join(", ");
    const message =
      studentIds.length === 1
        ? `Student ${studentNames} assigned to tutor ${tutor.user.name}`
        : `${studentIds.length} students assigned to tutor ${tutor.user.name}`;

    res.status(200).json({
      status: "success",
      message,
      data: {
        tutorId: tutor.id,
        tutorName: tutor.user.name,
        assignedCount: updatedStudents.length,
        students: updatedStudents.map((student) => ({
          studentId: student.id,
          studentName: student.user.name,
          studentEmail: student.user.email,
        })),
        // reassignedFromOtherTutors:
        //   alreadyAssigned.length > 0
        //     ? {
        //         count: alreadyAssigned.length,
        //         details: alreadyAssigned.map((s) => ({
        //           studentName: s.user.name,
        //           previousTutorName: s.tutor?.user?.name || "Unknown",
        //         })),
        //       }
        //     : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to assign students to tutor",
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

        tutor:{
          select:{
            userId:true,
          }
        }
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

   const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        tutorId: null,
      },
    });

    if(updatedStudent) {
      await prisma.conversation.deleteMany({
        where: {
          studentId: student.userId,
          tutorId: student.tutor.userId,
        },
      });
    }

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
