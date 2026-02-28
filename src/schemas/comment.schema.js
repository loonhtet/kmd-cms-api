import z from "zod/v3";

const commentSchema = z.object({
  content: z
    .string({ required_error: "Content is required" })
    .min(1, "Content cannot be empty")
    .max(500, "Content must not exceed 500 characters"),
});

export { commentSchema };
