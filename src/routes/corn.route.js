import { Router } from "express";
import { runJob } from "../jobs/user.job.js";

const cronRouter = Router();

cronRouter.post("/inactive-check", async (req, res) => {
  const secret = req.headers["x-cron-secret"];
  if (secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  await runJob();
  res.json({ message: "Job completed" });
});

export default cronRouter;
