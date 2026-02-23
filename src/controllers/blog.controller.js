import { prisma } from "../config/db.js";
import { generateSignedUrl } from "../utils/cloudflare.js";

export const createBlog = async (req, res) => {
  try {
    const { title, content, assetKey, assetType, tagIds } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        status: "error",
        message: "Title and content are required",
      });
    }

    if (assetKey && !assetType) {
      return res.status(400).json({
        status: "error",
        message: "assetType is required when assetKey is provided",
      });
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        // userId: req.user.id,
        userId:"991c57be-eedb-480c-a900-4982a3114451",
        assetKey: assetKey || null,
        assetType: assetKey ? assetType : null,
      },
    });

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

    let assetUrl = null;
    if (blog.assetKey) {
      assetUrl = await generateSignedUrl(blog.assetKey);
    }

    res.status(201).json({
      status: "success",
      message: "Blog created successfully",
      data: {
        ...blog,
        assetUrl,
      },
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await prisma.blog.findMany({
      include: {
        tags: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const blogsWithUrl = await Promise.all(
      blogs.map(async (blog) => {
        let assetUrl = null;

        if (blog.assetKey) {
          assetUrl = await generateSignedUrl(blog.assetKey);
        }

        return {
          ...blog,
          assetUrl,
        };
      })
    );

    res.status(200).json({
      status: "success",
      data: blogsWithUrl,
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};


export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, assetKey, assetType, tagIds } = req.body;

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
        assetKey: assetKey ?? blog.assetKey,
        assetType: assetKey ? assetType : blog.assetType,
      },
    });

    if (tagIds?.length) {
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

    let assetUrl = null;
    if (updatedBlog.assetKey) {
      assetUrl = await generateSignedUrl(updatedBlog.assetKey);
    }

    res.status(200).json({
      status: "success",
      data: {
        ...updatedBlog,
        assetUrl,
      },
    });

  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
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


