// schemas/document.schema.js
import { z } from "zod";

export const documentSchema = z.object({
  studentId: z.string().uuid(),
  tutorId: z.string().uuid(),
  title: z.string().min(1).max(100),
  file: z.string().min(1),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  file: z.string().min(1).optional(),
});