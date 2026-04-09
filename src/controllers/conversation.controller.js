import { prisma } from "../config/db.js";
import paginate from "../utils/pagination.js";

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;
    const io = req.app.get("io");

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (senderId !== conversation.studentId && senderId !== conversation.tutorId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const receiverId =
      senderId === conversation.studentId
        ? conversation.tutorId
        : conversation.studentId;

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content,
      },
    });

    io.to(`user_${receiverId}`).emit("new_message", message);

    res.status(200).json({
      status: "success",
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to send message",
      error: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, isRead } = req.query;

    let whereClause = { OR: [{ senderId: userId }, { receiverId: userId }] };

    if (conversationId) {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { studentId: true, tutorId: true },
      });

      if (!conversation) {
        return res.status(404).json({
          status: "error",
          message: "Conversation not found",
        });
      }

      if (conversation.studentId !== userId && conversation.tutorId !== userId) {
        return res.status(403).json({
          status: "error",
          message: "Not allowed",
        });
      }

      whereClause = { conversationId };
    }

    if (isRead === "true" || isRead === "false") {
      whereClause = {
        ...whereClause,
        isRead: isRead === "true",
      };
    }

    const result = await paginate(prisma.message, req, {
      where: whereClause,
      select: {
        id: true,
        conversationId: true,
        content: true,
        senderId: true,
        receiverId: true,
        isRead: true,
        readAt: true,
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
      meta: result.meta,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch Messages",
      error: error.message,
    });
  }
};

const updateMessageReadStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId, isRead } = req.body;
    const io = req.app.get("io");

    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        receiverId: true,
        isRead: true,
        readAt: true,
      },
    });

    if (!existingMessage) {
      return res.status(404).json({
        status: "error",
        message: "Message not found",
      });
    }

    if (existingMessage.receiverId !== userId) {
      return res.status(403).json({
        status: "error",
        message: "Not allowed",
      });
    }

    const nextReadAt = isRead ? existingMessage.readAt || new Date() : null;

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isRead,
        readAt: nextReadAt,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        receiverId: true,
        isRead: true,
        readAt: true,
        updatedAt: true,
      },
    });

    io.to(`user_${updatedMessage.senderId}`).emit(
      "message_status_updated",
      updatedMessage
    );
    io.to(`user_${updatedMessage.receiverId}`).emit(
      "message_status_updated",
      updatedMessage
    );

    res.status(200).json({
      status: "success",
      message: `Message marked as ${isRead ? "read" : "unread"}`,
      data: updatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update message status",
      error: error.message,
    });
  }
};

const getAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search?.trim();

    const whereClause = {
      OR: [{ studentId: userId }, { tutorId: userId }],
      ...(search && {
        User_Conversation_studentIdToUser: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
    };
    const data = await prisma.conversation.findMany({
      where: whereClause,
      select: {
        id: true,
        studentId: true,
        tutorId: true,
        User_Conversation_studentIdToUser: {
          select: {
            name: true,
            email: true,
          },
        },
        User_Conversation_tutorIdToUser: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const conversationIds = data.map((conversation) => conversation.id);
    const unreadCountByConversation = new Map();

    if (conversationIds.length > 0) {
      const unreadCounts = await prisma.message.groupBy({
        by: ["conversationId"],
        where: {
          conversationId: { in: conversationIds },
          receiverId: userId,
          isRead: false,
        },
        _count: {
          _all: true,
        },
      });

      unreadCounts.forEach((item) => {
        unreadCountByConversation.set(item.conversationId, item._count._all);
      });
    }

    const conversations = data.map((conversation) => ({
      id: conversation.id,
      studentName: conversation.User_Conversation_studentIdToUser.name,
      initialName: conversation.User_Conversation_studentIdToUser.name
        .charAt(0)
        .toUpperCase(),
      tutorName: conversation.User_Conversation_tutorIdToUser.name,
      tutorInitialName: conversation.User_Conversation_tutorIdToUser.name
        .charAt(0)
        .toUpperCase(),
      unreadCount: unreadCountByConversation.get(conversation.id) || 0,
    }));

    res.status(200).json({
      status: "success",
      data: conversations,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch Conversations",
      error: error.message,
    });
  }
};



export {
  sendMessage,
  getMessages,
  getAllConversations,
  updateMessageReadStatus,
};
