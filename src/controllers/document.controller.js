import {
  uploadToCloudflare,
  deleteFromCloudflare,
  generateSignedUrl,
} from "../utils/cloudflare.js";
import { prisma } from "../config/db.js";

// ==============================
// GET /documents/:id
// ==============================
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        tutor: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!document)
      return res.status(404).json({ status: "error", message: "Document not found" });

    const fileUrl = document.file ? await generateSignedUrl(document.file) : null;

    // Fetch uploader manually
    const uploadedBy = await prisma.user.findUnique({
      where: { id: document.uploadedById },
      select: { id: true, name: true },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: document.id,
        title: document.title,
        fileUrl,
        student: document.student
          ? { id: document.student.id, name: document.student.user.name }
          : null,
        tutor: document.tutor
          ? { id: document.tutor.id, name: document.tutor.user.name }
          : null,
          uploadedBy: uploadedBy
          ? { id: uploadedBy.id, name: uploadedBy.name }
          : null,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error("[getDocument]", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ==============================
// GET /documents
// ==============================
export const getDocuments = async (req, res) => {
  try {
    const { studentId, tutorId, title, uploadedByName, cursor, limit = 10 } = req.query;
    const take = parseInt(limit);

    let uploadedByIds = undefined;

    // If uploadedByName is provided, find matching user IDs
    if (uploadedByName) {
      const users = await prisma.user.findMany({
        where: { name: { contains: uploadedByName, mode: "insensitive" } },
        select: { id: true },
      });
      uploadedByIds = users.map((u) => u.id);
      if (uploadedByIds.length === 0) {
        // No users match, return empty result
        return res.status(200).json({
          status: "success",
          data: [],
          pagination: { nextCursor: null, hasNextPage: false, totalDocuments: 0 },
        });
      }
    }

    const whereClause = {
      ...(studentId && { studentId: String(studentId) }),
      ...(tutorId && { tutorId: String(tutorId) }),
      ...(title && { title: { contains: title, mode: "insensitive" } }),
      ...(uploadedByIds && { uploadedById: { in: uploadedByIds } }),
    };

    // Fetch documents
    const [documents, totalDocuments] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        take: take + 1,
        ...(cursor && { cursor: { id: cursor }, skip: 1 }),
        include: {
          student: { include: { user: { select: { id: true, name: true } } } },
          tutor: { include: { user: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where: whereClause }),
    ]);

    const hasNextPage = documents.length > take;
    const data = hasNextPage ? documents.slice(0, -1) : documents;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    // Map signed URLs and fetch uploadedBy manually
    const documentsWithUrl = await Promise.all(
      data.map(async (doc) => {
        const fileUrl = await generateSignedUrl(doc.file);

        const uploadedBy = await prisma.user.findUnique({
          where: { id: doc.uploadedById },
          select: { id: true, name: true },
        });

        return {
          id: doc.id,
          title: doc.title,
          fileUrl,
          student: doc.student ? { id: doc.student.id, name: doc.student.user.name } : null,
          tutor: doc.tutor ? { id: doc.tutor.id, name: doc.tutor.user.name } : null,
          uploadedBy: uploadedBy ? { id: uploadedBy.id, name: uploadedBy.name } : null,
          createdAt: doc.createdAt,
        };
      })
    );

    return res.status(200).json({
      status: "success",
      data: documentsWithUrl,
      pagination: { nextCursor, hasNextPage, totalDocuments },
    });
  } catch (error) {
    console.error("[getDocuments]", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};
// ==============================
// CREATE DOCUMENT
// ==============================
export const createDocument = async (req, res) => {
  let uploadedKey = null;
  try {
    const { userId, title, studentId } = req.body;

    if (!req.file)
      return res.status(400).json({ status: "error", message: "File is required" });

    uploadedKey = await uploadToCloudflare(req.file, "documents/");

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, studentProfile: true, tutorProfile: true },
    });

    if (!user)
      return res.status(404).json({ status: "error", message: "User not found" });

    let tutorId;
    let studentIds = [];

    if (user.studentProfile) {
      // ❌ Student must have a tutor
      if (!user.studentProfile.tutorId) {
        return res.status(400).json({
          status: "error",
          message: "Student must be assigned to a tutor before uploading documents",
        });
      }
      studentIds = [user.studentProfile.id];
      tutorId = user.studentProfile.tutorId;
    } else if (user.tutorProfile) {
      tutorId = user.tutorProfile.id;

      if (!studentId) {
        return res.status(400).json({
          status: "error",
          message: "studentId required for tutor uploads",
        });
      }

      studentIds = Array.isArray(studentId) ? studentId : [studentId];
    } else {
      return res.status(400).json({
        status: "error",
        message: "User must be either a student or a tutor",
      });
    }

    // Create documents
    const documents = await Promise.all(
      studentIds.map((sid) =>
        prisma.document.create({
          data: { studentId: sid, tutorId, title, file: uploadedKey, uploadedById: user.id },
          include: {
            student: { include: { user: { select: { id: true, name: true } } } },
            tutor: { include: { user: { select: { id: true, name: true } } } },
          },
        })
      )
    );

    const fileUrl = await generateSignedUrl(documents[0].file);

    return res.status(201).json({
      status: "success",
      data: {
        title,
        fileUrl,
        students: documents.map((d) => ({
          id: d.student.id,
          name: d.student.user.name,
        })),
        tutor: documents[0].tutor
          ? { id: documents[0].tutor.id, name: documents[0].tutor.user.name }
          : null,
        uploadedBy: { id: user.id, name: user.name },
      },
    });
  } catch (error) {
    if (uploadedKey) await deleteFromCloudflare(uploadedKey);
    console.error("[createDocument]", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ==============================
// UPDATE DOCUMENT
// ==============================
export const updateDocument = async (req, res) => {
  let uploadedKey = null;
  try {
    const { id } = req.params;
    const { title } = req.body;

    const existing = await prisma.document.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        tutor: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (!existing)
      return res.status(404).json({ status: "error", message: "Document not found" });

    if (req.file) {
      uploadedKey = await uploadToCloudflare(req.file, "documents/");
      if (existing.file) await deleteFromCloudflare(existing.file);
    }

    const updated = await prisma.document.update({
      where: { id },
      data: { ...(title && { title }), ...(uploadedKey && { file: uploadedKey }) },
      include: {
        student: { include: { user: { select: { id: true, name: true } } } },
        tutor: { include: { user: { select: { id: true, name: true } } } },
      },
    });

     // Get signed URL for the updated file
    const fileUrl = await generateSignedUrl(updated.file);

    // Fetch uploader manually
    const uploadedBy = await prisma.user.findUnique({
      where: { id: existing.uploadedById },
      select: { id: true, name: true },
    });

    return res.status(200).json({
      status: "success",
      data: {
        id: updated.id,
        title: updated.title,
        fileUrl,
        student: updated.student
          ? { id: updated.student.id, name: updated.student.user.name }
          : null,
        tutor: updated.tutor
          ? { id: updated.tutor.id, name: updated.tutor.user.name }
          : null,
        uploadedBy: uploadedBy
          ? { id: uploadedBy.id, name: uploadedBy.name }
          : null,
        createdAt: updated.createdAt,
      },
      message: "Document updated successfully",
    });
  } catch (error) {
    if (uploadedKey) await deleteFromCloudflare(uploadedKey);
    console.error("[updateDocument]", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ==============================
// DELETE DOCUMENT
// ==============================
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ status: "error", message: "Document not found" });

    if (existing.file) await deleteFromCloudflare(existing.file);

    await prisma.document.delete({ where: { id } });

    return res.status(200).json({ status: "success", message: "Document deleted successfully" });
  } catch (error) {
    console.error("[deleteDocument]", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};