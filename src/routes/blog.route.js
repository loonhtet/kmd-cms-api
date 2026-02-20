import { Router } from "express"
import { createBlog,getAllBlogs,updateBlog,deleteBlog } from "../controllers/blog.controller.js";

const router = Router();

router.post("/create-blog", createBlog);
router.post("/get-all-blogs", getAllBlogs);


// Update blog with ID in URL
router.put("/update-blog/:id", updateBlog);

// Delete blog with ID in URL
router.delete("/delete-blog/:id", deleteBlog);

export default router;