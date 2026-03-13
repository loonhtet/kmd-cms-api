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

        if (
            senderId !== conversation.studentId &&
            senderId !== conversation.tutorId
        ) {
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
        console.log('receiverID',receiverId)
        io.to(`user_${receiverId}`).emit("new_message", message);

        res.status(200).json({
            status: "success",
            message: "Message sent successfully",
            data:message,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            status: "error",
            message: "Could not login",
            error: error.message,
        });
    }
};

const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const {conversationId} = req.query;

    const whereClause = conversationId
      ? {
            conversationId: conversationId,
        }
      : {OR: [{ senderId: userId }, { receiverId: userId }],};

    const result = await paginate(prisma.message, req, {
      where: whereClause,
      select: {
        id: true,
        conversationId: true,
        content: true,
        senderId: true,
        receiverId: true,
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

const getAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const whereClause = {
      OR: [{ studentId: userId }, { tutorId: userId }],
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

    const conversations = data.map((conversation) => ({
      id: conversation.id,
      studentName: conversation.User_Conversation_studentIdToUser.name,
      initialName: conversation.User_Conversation_studentIdToUser.name.charAt(0).toUpperCase(),
      tutorName: conversation.User_Conversation_tutorIdToUser.name,
      tutorInitialName: conversation.User_Conversation_tutorIdToUser.name.charAt(0).toUpperCase(),
    }))
   

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



export { sendMessage, getMessages, getAllConversations };