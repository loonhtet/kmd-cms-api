import { prisma } from "../config/db.js";
import bcrypt from "bcrypt";
import paginate from "../utils/pagination.js";

const getAdmins = async (req, res) => {
  try {
    const result = await paginate(prisma.admin, req, {
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        register: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch admins",
      error: error.message,
    });
  }
};

const getAdminLookup = async (req, res) => {
  try {
    const admin = await prisma.admin.findMany({
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
      data: admin,
      total: admin.length,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch admins list",
      error: error.message,
    });
  }
};

const getSingleAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        register: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch admin",
      error: error.message,
    });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { image, email, name, password, role, register } = req.body;

    const adminExists = await prisma.admin.findUnique({
      where: { email },
    });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.admin.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role,
        image: image || null,
        register: register || false,
      },
    });

    res.status(201).json({
      status: "success",
      message: "Admin registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create admin",
      error: error.message,
    });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { image, email, name, role, register } = req.body;

    const adminExists = await prisma.admin.findUnique({
      where: { id },
    });

    if (!adminExists) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
    }

    if (email && email !== adminExists.email) {
      const emailTaken = await prisma.admin.findUnique({
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
      ...(role && { role }),
      ...(image !== undefined && { image: image || null }),
      ...(register !== undefined && { register }),
    };

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        image: true,
        register: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Admin updated successfully",
      data: updatedAdmin,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update admin",
      error: error.message,
    });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const adminExists = await prisma.admin.findUnique({
      where: { id },
    });

    if (!adminExists) {
      return res.status(404).json({
        status: "error",
        message: "Admin not found",
      });
    }

    await prisma.admin.delete({
      where: { id },
    });

    res.status(200).json({
      status: "success",
      message: "Admin deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete admin",
      error: error.message,
    });
  }
};

export {
  getAdmins,
  getAdminLookup,
  getSingleAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};
