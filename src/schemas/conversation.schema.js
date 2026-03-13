import z from "zod/v3";

const sendMessageSchema = z.object({
  conversationId: z
    .string({ required_error: "Conversation ID is required" })
    .uuid("Invalid conversation ID format"),
  content: z
    .string({ required_error: "Content is required" })
    .min(1, "Content must not be empty")
    .max(1000, "Content must be less than 1000 characters"),
});


export { sendMessageSchema };