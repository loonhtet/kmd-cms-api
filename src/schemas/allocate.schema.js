import z from "zod/v3";

const assignStudentSchema = z.object({
  studentId: z
    .string({ required_error: "Student ID is required" })
    .uuid("Invalid student ID format"),
  tutorId: z
    .string({ required_error: "Tutor ID is required" })
    .uuid("Invalid tutor ID format"),
});

const unassignStudentSchema = z.object({
  studentId: z
    .string({ required_error: "Student ID is required" })
    .uuid("Invalid student ID format"),
});

export { assignStudentSchema, unassignStudentSchema };
