import { Router } from "express";

import { getSidebar } from "../controllers/sidebar.controller.js";

const sidebarRouter = Router();

sidebarRouter.get("/", getSidebar);

export default sidebarRouter;
