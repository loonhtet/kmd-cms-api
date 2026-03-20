import z from "zod/v3";

const userActivitySchema = z.object({
  page: z
    .string({ required_error: "Page is required" })
    .max(200, "Page must not exceed 200 characters"),


});

export { userActivitySchema };
