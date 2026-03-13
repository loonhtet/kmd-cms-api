import { Router } from "express";
import multer from "multer";
import {
  createBlog,
  getBlogs,
  updateBlog,
  deleteBlog,
  getSingleBlog,
} from "../controllers/blog.controller.js";
import {
  getComments,
  createComment,
  editComment,
  deleteComment,
} from "../controllers/comment.controller.js";
import { upload } from "../middleware/uploadMiddleware.js";
import { blogSchema } from "../schemas/blog.schema.js";
import { commentSchema } from "../schemas/comment.schema.js";
import validate from "../utils/validate.js";

const router = Router();

const handleUploadErrors = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        status: "error",
        message: "File too big! Max 5MB.",
      });
    }
    next(err);
  });
};

// Blog routes
router.get("/", getBlogs);
router.get("/:slug", getSingleBlog);
router.post("/", handleUploadErrors, validate(blogSchema), createBlog);
router.put("/:id", handleUploadErrors, updateBlog);
router.delete("/:id", deleteBlog);

// Comment routes
router.get("/:blogId/comments", getComments);
router.post("/:blogId/comments", validate(commentSchema), createComment);
router.put("/comments/:id", validate(commentSchema), editComment);
router.delete("/comments/:id", deleteComment);

export default router;
