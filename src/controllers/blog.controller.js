import { prisma } from "../config/db.js";
import {
  uploadToCloudflare,
  deleteFromCloudflare,
  generateSignedUrl,
} from "../utils/cloudflare.js";
import slugify from "slugify";

export const getBlogs = async (req, res) => {
  try {
    const { userId, tag, title, cursor, limit = 10 } = req.query;
    const take = parseInt(limit);
    const whereClause = {
      ...(userId && { userId }),
      ...(title && {
        title: {
          contains: title,
          mode: "insensitive",
        },
      }),
      ...(tag && {
        tags: {
          some: { title: tag },
        },
      }),
    };

    const [blogs, totalBlogs] = await Promise.all([
      prisma.blog.findMany({
        where: whereClause,
        take: take + 1,
        ...(cursor && {
          cursor: { id: cursor },
          skip: 1,
        }),
        include: {
          tags: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.blog.count({ where: whereClause }),
    ]);

    const hasNextPage = blogs.length > take;
    const data = hasNextPage ? blogs.slice(0, -1) : blogs;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    const blogsWithUrl = await Promise.all(
      data.map(async (blog) => {
        const assetUrl = blog.assetKey
          ? await generateSignedUrl(blog.assetKey)
          : null;
        return { ...blog, assetUrl };
      }),
    );

    res.status(200).json({
      status: "success",
      data: blogsWithUrl,
      pagination: {
        nextCursor,
        hasNextPage,
        totalBlogs,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
export const getSingleBlog = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await prisma.blog.findUnique({
      where: { slug },
      include: {
        tags: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }
    let assetUrl = null;
    if (blog.assetKey) {
      assetUrl = await generateSignedUrl(blog.assetKey);
    }
    res.status(200).json({
      status: "success",
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

export const createBlog = async (req, res) => {
  let uploadedKey = null;
  try {
    const { title, content, tagIds } = req.body;
    console.log("FILE:", req.file);
    console.log("BODY:", req.body);

    let assetType = null;
    if (req.file) {
      uploadedKey = await uploadToCloudflare(req.file, "blogs/");
      if (req.file.mimetype.startsWith("image")) {
        assetType = "IMAGE";
      } else if (req.file.mimetype.startsWith("video")) {
        assetType = "VIDEO";
      }
    }

    // Generate unique slug
    const baseSlug = slugify(title, { lower: true, strict: true });
    const existingSlug = await prisma.blog.findUnique({
      where: { slug: baseSlug },
    });
    const slug = existingSlug ? `${baseSlug}-${Date.now()}` : baseSlug;

    const blog = await prisma.blog.create({
      data: {
        title,
        content,
        slug,
        userId: req.user.id,
        assetKey: uploadedKey,
        assetType,
        tags: tagIds?.length
          ? {
              connectOrCreate: tagIds.map((tagName) => ({
                where: { title: tagName },
                create: { title: tagName },
              })),
            }
          : undefined,
      },
      include: {
        tags: true,
      },
    });

    const assetUrl = blog.assetKey
      ? await generateSignedUrl(blog.assetKey)
      : null;

    res.status(201).json({
      status: "success",
      data: {
        ...blog,
        assetUrl,
      },
    });
  } catch (error) {
    if (uploadedKey) {
      await deleteFromCloudflare(uploadedKey);
    }
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

export const updateBlog = async (req, res) => {
  let newUploadedKey = null;
  try {
    const { id } = req.params;
    const { title, content, tagIds, removeFile } = req.body;

    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) {
      return res.status(404).json({
        status: "error",
        message: "Blog not found",
      });
    }

    let assetKey = blog.assetKey;
    let assetType = blog.assetType;

    if (req.file) {
      newUploadedKey = await uploadToCloudflare(req.file, "blogs/");
      if (blog.assetKey) {
        await deleteFromCloudflare(blog.assetKey);
      }
      assetKey = newUploadedKey;
      assetType = req.file.mimetype.startsWith("image") ? "IMAGE" : "VIDEO";
    } else if (removeFile === "true" && blog.assetKey) {
      await deleteFromCloudflare(blog.assetKey);
      assetKey = null;
      assetType = null;
    }

    let slug = blog.slug;
    if (title && title !== blog.title) {
      const baseSlug = slugify(title, { lower: true, strict: true });
      const existingSlug = await prisma.blog.findUnique({
        where: { slug: baseSlug },
      });
      slug =
        existingSlug && existingSlug.id !== id
          ? `${baseSlug}-${Date.now()}`
          : baseSlug;
    }

    let tagsUpdate = undefined;
    if (tagIds !== undefined) {
      tagsUpdate =
        tagIds.length > 0
          ? {
              set: [],
              connectOrCreate: tagIds.map((tagName) => ({
                where: { title: tagName },
                create: { title: tagName },
              })),
            }
          : { set: [] };
    }

    const updatedBlog = await prisma.blog.update({
      where: { id },
      data: {
        title: title ?? blog.title,
        content: content ?? blog.content,
        slug,
        assetKey,
        assetType,
        tags: tagsUpdate,
      },
      include: {
        tags: true,
      },
    });

    const assetUrl = updatedBlog.assetKey
      ? await generateSignedUrl(updatedBlog.assetKey)
      : null;

    res.status(200).json({
      status: "success",
      data: {
        ...updatedBlog,
        assetUrl,
      },
    });
  } catch (error) {
    if (newUploadedKey) {
      await deleteFromCloudflare(newUploadedKey);
    }
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

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

    if (blog.assetKey) {
      await deleteFromCloudflare(blog.assetKey);
    }

    await prisma.blog.delete({ where: { id } });

    res.status(200).json({
      status: "success",
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};
