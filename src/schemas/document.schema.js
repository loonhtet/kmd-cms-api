// schemas/document.schema.js
import { z } from "zod";

export const documentSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(100),
  studentId: z.union([
    z.string().uuid(),
    z.array(z.string().uuid())
  ]).optional()
});
export const updateDocumentSchema = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(100).optional(),
  studentId: z.union([
    z.string().uuid(),
    z.array(z.string().uuid())
  ]).optional()
});