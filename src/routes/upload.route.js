import { Router } from "express";
import multer from "multer";
import {upload} from "../middleware/uploadMiddleware.js";
import { uploadFile } from "../controllers/upload.controller.js";

const router = Router();

router.post("/upload", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // This catches the "fileSize" limit specifically
      return res.status(400).json({
        success: false,
        message: err.code === "LIMIT_FILE_SIZE" ? "File too big! Max 5MB." : err.message,
      });
    } else if (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
    // No error? Move to the controller
    next();
  });
}, uploadFile);

export default router;