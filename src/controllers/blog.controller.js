import { prisma } from "../config/db.js";

export const createBlog = async (req, res) => {
  try {
    const { title, content, assetURL, assetType, tagIds } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        status: "error",
        message: "Title and content are required",
      });
    }

    // Validate asset logic
    if (assetURL && !assetType) {
      return res.status(400).json({
        status: "error",
        message: "assetType is required when assetURL is provided",
      });
    }

    // Create blog first
    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        // userId: req.user.id,
        userId: "991c57be-eedb-480c-a900-4982a3114451",
        assetURL: assetURL || null,
        assetType: assetURL ? assetType : null,
      },
    });

    // Attach tags if provided
    if (tagIds?.length) {
      for (const tagName of tagIds) {
        await prisma.blog.update({
          where: { id: blog.id },
          data: {
            tags: {
              connectOrCreate: {
                where: { title: tagName },
                create: { title: tagName },
              },
            },
          },
        });
      }
    }

    res.status(201).json({
      status: "success",
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to create blog",
      error: error.message,
    });
  }
};

// GET ALL BLOGS
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      include: {
        tags: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({
      status: "success",
      message: "Blogs fetched successfully",
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to fetch blogs",
      error: error.message,
    });
  }
};

// UPDATE BLOG
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, assetURL, assetType, tagIds } = req.body;

    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        title: title || blog.title,
        content: content || blog.content,
        assetURL: assetURL ?? blog.assetURL,
        assetType: assetURL ? assetType : blog.assetType,
      },
    });

    if (tagIds?.length) {
      // Reset tags
      await prisma.blog.update({
        where: { id },
        data: { tags: { set: [] } },
      });

      for (const tagName of tagIds) {
        await prisma.blog.update({
          where: { id },
          data: {
            tags: {
              connectOrCreate: {
                where: { title: tagName },
                create: { title: tagName },
              },
            },
          },
        });
      }
    }

    res.status(200).json({
      status: "success",
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to update blog",
      error: error.message,
    });
  }
};

// DELETE BLOG
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    await prisma.blog.delete({ where: { id } });

    res.status(200).json({
      status: "success",
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to delete blog",
      error: error.message,
    });
  }
};


