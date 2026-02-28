import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import userRouter from "./routes/user.route.js";
import authRouter from "./routes/auth.route.js";
import cors from "cors";
import roleRouter from "./routes/role.route.js";
import { protect } from "./middleware/authMiddleware.js";
import allocateRouter from "./routes/allocate.route.js";
import emailRouter from "./routes/email.route.js";
import blogRouter from "./routes/blog.route.js";
import rateLimit from "express-rate-limit";
import scheduleRouter from "./routes/schedule.route.js";
import sidebarRouter from "./routes/sidebar.route.js";
import tagRouter from "./routes/tag.router.js";

config();
connectDB();

const app = express();

const globalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://e-tutoring-seven.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(globalLimiter);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/roles", protect, roleRouter);
app.use("/api/v1/allocate", allocateRouter);
app.use("/api/v1/schedule", protect, scheduleRouter);
app.use("/api/v1/email", emailRouter);
app.use("/api/v1/blogs", protect, blogRouter);
app.use("/api/v1/tags", tagRouter);
app.use("/api/v1/sidebar", protect, sidebarRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection", err);
  disconnectDB();
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception", err);
  disconnectDB();
  process.exit(1);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  disconnectDB();
  process.exit(0);
});

export default app;
