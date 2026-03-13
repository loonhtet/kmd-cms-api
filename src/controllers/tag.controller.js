import { prisma } from "../config/db.js";

export const getTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { title: "asc" },
    });

    res.status(200).json({
      status: "success",
      data: tags,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
