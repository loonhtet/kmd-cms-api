import { Router } from "express";
import {
  createActivity,
  getActivities,
  getActivityDetails,
  getActivityLeaderboard,
  getActivityStats,
} from "../controllers/userActivity.controller.js";
import { userActivitySchema } from "../schemas/userActivity.schema.js";
import validate from "../utils/validate.js";
import { requireStaffOrAdmin } from "../middleware/permissionMiddleware.js";

const userActivityRouter = Router();

userActivityRouter.get("/", requireStaffOrAdmin, getActivities);
userActivityRouter.get("/stats", requireStaffOrAdmin, getActivityStats);
userActivityRouter.get("/leaderboard", requireStaffOrAdmin, getActivityLeaderboard);
userActivityRouter.get("/details", requireStaffOrAdmin, getActivityDetails);

userActivityRouter.post("/", validate(userActivitySchema), createActivity);

export default userActivityRouter;
