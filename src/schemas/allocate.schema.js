import z from "zod/v3";

const assignStudentSchema = z.object({
  studentIds: z
    .array(z.string().uuid("Each student ID must be a valid UUID"))
    .min(1, "At least one student ID is required")
    .max(100, "Cannot assign more than 100 students at once"),
  tutorId: z.string().uuid("Tutor ID must be a valid UUID"),
});

const unassignStudentSchema = z.object({
  studentId: z
    .string({ required_error: "Student ID is required" })
    .uuid("Invalid student ID format"),
});

export { assignStudentSchema, unassignStudentSchema };
