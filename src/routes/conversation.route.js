import { Router } from "express";
import validate from "../utils/validate.js";
import {
  sendMessage,
  getMessages,
  getAllConversations,
  updateMessageReadStatus,
} from "../controllers/conversation.controller.js";
import {
  sendMessageSchema,
  updateMessageReadStatusSchema,
} from "../schemas/conversation.schema.js";

const conversationRouter = Router();

conversationRouter.get("/", getAllConversations);
conversationRouter.post(
  "/send-message",
  validate(sendMessageSchema),
  sendMessage
);
conversationRouter.get("/messages", getMessages);
conversationRouter.post(
  "/messages/status",
  validate(updateMessageReadStatusSchema),
  updateMessageReadStatus
);

export default conversationRouter;
