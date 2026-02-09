import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import paginate from "../utils/pagination.js";

const getUsers = async (req, res) => {
  try {
    const { role } = req.query;

    const whereClause = role
      ? {
          roles: {
            some: {
              role: {
                name: role,
              },
            },
          },
        }
      : {};

    const result = await paginate(prisma.user, req, {
      where: whereClause,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transformedData = result.data.map((user) => ({
      ...user,
      roles: user.roles.map((ur) => ur.role.name),
    }));

    res.status(200).json({
      status: "success",
      data: transformedData,
      meta: result.meta,
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
          roles: {
            some: {
              role: {
                name: role,
              },
            },
          },
        }
      : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
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
        image: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
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
      roles: user.roles.map((ur) => ur.role.name),
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
    const { image, email, name, password, role } = req.body;

    const userExists = await prisma.user.findUnique({
      where: { email },
    });

    if (userExists) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          image: image || null,
        },
      });

      let roleRecord = await tx.role.findUnique({
        where: { name: role },
      });

      if (!roleRecord) {
        roleRecord = await tx.role.create({
          data: { name: role },
        });
      }

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: roleRecord.id,
        },
      });

      if (role === "student") {
        await tx.student.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === "tutor") {
        await tx.tutor.create({
          data: {
            userId: user.id,
          },
        });
      } else if (role === "staff" || role === "admin_staff") {
        await tx.staff.create({
          data: {
            userId: user.id,
            isAdmin: role === "admin_staff",
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
    const { image, email, name } = req.body;

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
      ...(image !== undefined && { image: image || null }),
    };

    await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
              },
            },
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
