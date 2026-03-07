import { prisma } from "../config/db.js";

export const getActivities = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { cursor, limit = 10 } = req.query;
    const take = parseInt(limit);

    const comments = await prisma.comment.findMany({
      where: { blogId },
      take: take + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const hasNextPage = comments.length > take;
    const data = hasNextPage ? comments.slice(0, -1) : comments;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    res.status(200).json({
      status: "success",
      data,
      pagination: {
        nextCursor,
        hasNextPage,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const createActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const {  page, browser } = req.body;

    const created = await prisma.userActivity.create({
      data: {
        userId,
        page,
        browser,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      status: "success",
      data: created,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
