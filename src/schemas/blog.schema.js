import z from "zod/v3";

const blogSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, "Title cannot be empty")
    .max(200, "Title must not exceed 200 characters"),
  content: z
    .string({ required_error: "Content is required" })
    .min(1, "Content cannot be empty"),
  tagIds: z
    .array(z.string().min(1, "Tag name cannot be empty"))
    .optional()
    .nullable(),
});

export { blogSchema };
