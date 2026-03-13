import { Router } from "express";
import validate from "../utils/validate.js";
import { sendMessage,getMessages,getAllConversations} from "../controllers/conversation.controller.js";
import { sendMessageSchema } from "../schemas/conversation.schema.js";

const conversationRouter = Router();

conversationRouter.get("/", getAllConversations);
conversationRouter.post("/send-message",validate(sendMessageSchema), sendMessage);
conversationRouter.get("/messages", getMessages);


export default conversationRouter;
