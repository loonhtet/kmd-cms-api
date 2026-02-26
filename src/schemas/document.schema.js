import z from "zod/v3";

const documentSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .min(1, "Title cannot be empty")
    .max(100, "Title must not exceed 100 characters"),
});

export { documentSchema };