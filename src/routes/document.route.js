import { Router } from "express";
import {
  uploadDocument,
  getDocuments,
  getDownloadUrl,
  deleteDocument,
} from "../controllers/document.controller.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { documentSchema } from "../schemas/document.schema.js";
import validate from "../utils/validate.js";

const documentRouter = Router();

documentRouter.get("/", getDocuments);
documentRouter.post("/", upload.single("file"), validate(documentSchema), uploadDocument);
documentRouter.get("/:id/download", getDownloadUrl);
documentRouter.delete("/:id", deleteDocument);

export default documentRouter;