import { prisma } from "../config/db.js";

const getRoles = async (req, res) => {
  try {
    const result = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch roles",
      error: error.message,
    });
  }
};

export { getRoles };
