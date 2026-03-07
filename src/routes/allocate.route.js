import { Router } from "express";

import validate from "../utils/validate.js";
import {
  assignStudentSchema,
  unassignStudentSchema,
} from "../schemas/allocate.schema.js";
import {
  assignStudentToTutor,
  unassignStudentFromTutor,
  getTutorWithStudents,
  getStudentWithTutor,
} from "../controllers/allocate.controller.js";
import { requireStaffOrAdmin } from "../middleware/permissionMiddleware.js";

const allocateRouter = Router();

allocateRouter.post(
  "/assign-student",
  validate(assignStudentSchema),
  assignStudentToTutor,
);

allocateRouter.post(
  "/unassign-tutor",
  validate(unassignStudentSchema),
  unassignStudentFromTutor,
);

allocateRouter.get("/tutor/:userId", getTutorWithStudents);

allocateRouter.get("/student/:userId", getStudentWithTutor);

export default allocateRouter;
