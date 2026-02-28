import { Router } from "express";
import { getTags } from "../controllers/tag.controller.js";

const tagRouter = Router();

tagRouter.get("/", getTags);

export default tagRouter;
