import { Router } from "express";
import {
  getWeeklyMeetingStatistics,
  getStudentDashboardStats,
  getRecentMessages,
} from "../controllers/studentDashboard.controller.js";

const studentDashboardRouter = Router();

studentDashboardRouter.get("/stats", getStudentDashboardStats);
studentDashboardRouter.get("/recent-messages", getRecentMessages);
studentDashboardRouter.get("/weekly-meeting-statistics", getWeeklyMeetingStatistics);

export default studentDashboardRouter;
