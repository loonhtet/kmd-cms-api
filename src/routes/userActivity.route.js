import { Router } from "express";
import {
  createActivity,
    getActivities,
} from "../controllers/userActivity.controller.js";
import { userActivitySchema } from "../schemas/userActivity.schema.js";
import validate from "../utils/validate.js";
import { requireStaffOrAdmin } from "../middleware/permissionMiddleware.js";

const userActivityRouter = Router();

userActivityRouter.get("/",requireStaffOrAdmin,getActivities);

userActivityRouter.post("/", validate(userActivitySchema),requireStaffOrAdmin, createActivity);

export default userActivityRouter;
