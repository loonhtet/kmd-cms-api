import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import paginate from "../utils/pagination.js";

const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query;
    const whereClause = {
      ...(role && {
        role: {
          role: role,
        },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
    const result = await paginate(prisma.user, req, {
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        lastActive: true,
        role: {
          select: {
            role: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            tutorId: true,
            tutor: {
              select: {
                id: true,
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
        },
        tutorProfile: {
          select: {
            id: true,
          },
        },
        staffProfile: {
          select: {
            id: true,
            isAdmin: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transformedData = result.data.map((user) => ({
      ...user,
      role: user.role?.role || null,
      studentProfile: user.studentProfile
        ? {
            id: user.studentProfile.id,
            tutorId: user.studentProfile.tutorId,
            tutor: user.studentProfile.tutor
              ? {
                  id: user.studentProfile.tutor.id,
                  ...user.studentProfile.tutor.user,
                }
              : null,
          }
        : null,
      tutorProfile: user.tutorProfile ?? null,
      staffProfile: user.staffProfile ?? null,
    }));

    res.status(200).json({
      status: "success",
      data: transformedData,
      meta: result.meta,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch Users",
      error: error.message,
    });
  }
};

const getUserLookup = async (req, res) => {
  try {
    const { role } = req.query;

    const whereClause = role
      ? {
          role: {
            role: role,
          },
        }
      : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.status(200).json({
      status: "success",
      data: users,
      total: users.length,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch Users list",
      error: error.message,
    });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        lastActive: true,
        role: {
          select: {
            role: true,
          },
        },
        studentProfile: {
          select: {
            id: true,
            tutorId: true,
            tutor: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        tutorProfile: {
          select: {
            id: true,
            students: {
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
        },
        staffProfile: {
          select: {
            id: true,
            isAdmin: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const transformedUser = {
      ...user,
      role: user.role?.role || null,
    };

    res.status(200).json({
      status: "success",
      data: transformedUser,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, name, password, role } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const validRoles = ["STUDENT", "TUTOR", "STAFF", "ADMIN"];
    const normalizedRole = role.toUpperCase();

    if (!validRoles.includes(normalizedRole)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid role",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          role: normalizedRole,
        },
      });

      if (normalizedRole === "STUDENT") {
        await tx.student.create({
          data: {
            userId: user.id,
          },
        });
      } else if (normalizedRole === "TUTOR") {
        await tx.tutor.create({
          data: {
            userId: user.id,
          },
        });
      } else if (normalizedRole === "STAFF" || normalizedRole === "ADMIN") {
        await tx.staff.create({
          data: {
            userId: user.id,
            isAdmin: normalizedRole === "ADMIN",
          },
        });
      }

      return user;
    });

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create user",
      error: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (email && email !== userExists.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });
      if (emailTaken) {
        return res.status(400).json({
          status: "error",
          message: "Email already exists",
        });
      }
    }

    const updateData = {
      ...(email && { email }),
      ...(name && { name }),
    };

    await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            role: true,
          },
        },
      },
    });

    res.status(200).json({
      status: "success",
      message: "User updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update user",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userExists = await prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

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

export {
  getUsers,
  getUserLookup,
  getSingleUser,
  createUser,
  updateUser,
  deleteUser,
  assignStudentToTutor,
  unassignStudentFromTutor,
};
