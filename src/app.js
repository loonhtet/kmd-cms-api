import express from "express";
import { config } from "dotenv";
import { connectDB, disconnectDB } from "./config/db.js";
import adminRouter from "./routes/admin.route.js";
import authRouter from "./routes/auth.route.js";
import emailRouter from "./routes/email.route.js";

config();
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/email", emailRouter);

app.listen(3000, () => {
     console.log("Server running on port http://localhost:3000");
     console.log("API Docs available at http://localhost:3000/api-docs");
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
