import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";
import { getTutorDashboard } from "../controllers/tutorDashboard.controller.js";

const dashboardRouter = Router();

dashboardRouter.get("/", getDashboardStats);
dashboardRouter.get("/tutor", getTutorDashboard);

export default dashboardRouter;
