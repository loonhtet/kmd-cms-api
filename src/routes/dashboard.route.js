import { Router } from "express";
import { getDashboardStats } from "../controllers/dashboard.controller.js";

const dashboardRouter = Router();

dashboardRouter.get("/", getDashboardStats);

export default dashboardRouter;
