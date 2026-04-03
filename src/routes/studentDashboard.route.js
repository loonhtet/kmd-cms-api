import { Router } from "express";
import {
  getWeeklyMeetingStatistics,
  getStudentDashboardStats,
  getRecentMessages,
  getActivityTrends,
} from "../controllers/studentDashboard.controller.js";

const studentDashboardRouter = Router();

studentDashboardRouter.get("/stats", getStudentDashboardStats);
studentDashboardRouter.get("/recent-messages", getRecentMessages);
studentDashboardRouter.get(
  "/weekly-meeting-statistics",
  getWeeklyMeetingStatistics,
);
studentDashboardRouter.get("/activity-trends", getActivityTrends);

export default studentDashboardRouter;
