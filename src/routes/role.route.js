import { Router } from "express";

import { roleSchema } from "../schemas/role.schema.js";
import validate from "../utils/validate.js";
import {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
} from "../controllers/role.controller.js";

const roleRouter = Router();

roleRouter.get("/", getRoles);

roleRouter.post("/", validate(roleSchema), createRole);

roleRouter.put("/:id", updateRole);

roleRouter.delete("/:id", deleteRole);

export default roleRouter;
