import { Router } from "express";

import { getRoles } from "../controllers/role.controller.js";

const roleRouter = Router();

roleRouter.get("/", getRoles);

export default roleRouter;
