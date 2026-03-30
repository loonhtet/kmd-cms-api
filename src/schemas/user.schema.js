import z from "zod/v3";

const userSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please provide a valid email address"),

  name: z
    .string({ required_error: "Name is required" })
    .max(100, "Name must not exceed 100 characters")
    .min(1, "Name cannot be empty"),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters long")
    .max(50, "Password must not exceed 50 characters"),

  role: z.enum(["STUDENT", "TUTOR", "STAFF", "ADMIN"], {
    required_error: "Role is required",
    invalid_type_error: "Role must be one of: student, tutor, staff, admin",
  }),
});

export { userSchema };
