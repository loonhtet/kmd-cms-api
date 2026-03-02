import { Router } from "express";
import {
  getSchedules,
  getSingleSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/schedule.controller.js";
import {
  scheduleSchema,
  updateScheduleSchema,
} from "../schemas/schedule.schema.js";
import validate from "../utils/validate.js";

const scheduleRouter = Router();

scheduleRouter.get("/", getSchedules);
scheduleRouter.get("/:id", getSingleSchedule);
scheduleRouter.post("/", validate(scheduleSchema), createSchedule);
scheduleRouter.put("/:id", validate(updateScheduleSchema), updateSchedule);
scheduleRouter.delete("/:id", deleteSchedule);

export default scheduleRouter;
