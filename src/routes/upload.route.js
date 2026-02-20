import { Router } from "express";
import multer from "multer";
import { uploadFile } from "../controllers/upload.controller.js";

const router = Router();
const upload = multer();

router.post("/upload", upload.single("file"), uploadFile);

export default router;