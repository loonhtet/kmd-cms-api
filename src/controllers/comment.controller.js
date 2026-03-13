import { prisma } from "../config/db.js";

export const getComments = async (req, res) => {
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

export const createComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { content } = req.body;

    const blog = await prisma.blog.findUnique({ where: { id: blogId } });
    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        blogId,
        userId: req.user.id,
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
      data: comment,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const editComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        status: "error",
        message: "You are not allowed to edit this comment",
      });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: { content },
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

    res.status(200).json({
      status: "success",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found",
      });
    }

    const isOwner = comment.userId === req.user.id;
    const isAdmin = req.user.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        status: "error",
        message: "You are not allowed to delete this comment",
      });
    }

    await prisma.comment.delete({ where: { id } });

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
