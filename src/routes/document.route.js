import { Router } from "express";
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} from "../controllers/document.controller.js";
import {
  documentSchema,
  updateDocumentSchema,
} from "../schemas/document.schema.js";
import validate from "../utils/validate.js";
import { handleDocumentUploadErrors } from "../middleware/uploadMiddleware.js";

const documentRouter = Router();

documentRouter.get("/", getDocuments);
documentRouter.get("/:id", getDocument);
documentRouter.post("/", handleDocumentUploadErrors, validate(documentSchema), createDocument);
documentRouter.put("/:id",handleDocumentUploadErrors, validate(updateDocumentSchema), updateDocument);
documentRouter.delete("/:id", deleteDocument);

export default documentRouter;