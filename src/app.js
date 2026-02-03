import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.route.js";
// import emailRouter from "./routes/email.route.js";
import cors from "cors";

config();
connectDB();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/auth", authRouter);
// app.use("/api/v1/email", emailRouter);
//
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

app.listen(3000, () => {
  console.log("Server running on port http://localhost:3000");
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
