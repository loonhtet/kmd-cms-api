import { prisma } from "../config/db.js";
import { r2Client, R2_BUCKET_NAME } from "../config/r2.js";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import paginate from "../utils/pagination.js";

const uploadDocument = async (req, res) => {
  try {
    const { title } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ status: "error", message: "No file uploaded" });
    }

    const userId = req.user.id;
    const student = await prisma.student.findFirst({ where: { userId } });
    const tutor = await prisma.tutor.findFirst({ where: { userId } });

    if (!student && !tutor) {
      return res.status(403).json({ status: "error", message: "Only students or tutors can upload documents" });
    }

    const fileExt = file.originalname.split(".").pop();
    const fileKey = `documents/${uuidv4()}.${fileExt}`;

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    const document = await prisma.document.create({
      data: {
        title,
        fileName: file.originalname,
        fileKey,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedByStudentId: student ? student.id : null,
        uploadedByTutorId: tutor ? tutor.id : null,
        studentId: student ? student.id : null,
        tutorId: tutor ? tutor.id : (student?.tutorId ?? null),
      },
    });

    res.status(201).json({
      status: "success",
      message: "Document uploaded successfully",
      data: { id: document.id, title: document.title, fileName: document.fileName },
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to upload document", error: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.student.findFirst({ where: { userId } });
    const tutor = await prisma.tutor.findFirst({ where: { userId } });

    if (!student && !tutor) {
      return res.status(403).json({ status: "error", message: "Access denied" });
    }

    const whereClause = student ? { studentId: student.id } : { tutorId: tutor.id };

    const { search } = req.query;
    if (search) {
      whereClause.title = { contains: search, mode: "insensitive" };
    }

    const result = await paginate(prisma.document, req, {
      where: whereClause,
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        uploadedByStudent: {
          select: { id: true, user: { select: { name: true } } },
        },
        uploadedByTutor: {
          select: { id: true, user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ status: "success", data: result.data, meta: result.meta });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to fetch documents", error: error.message });
  }
};

const getDownloadUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ status: "error", message: "Document not found" });
    }

    const student = await prisma.student.findFirst({ where: { userId } });
    const tutor = await prisma.tutor.findFirst({ where: { userId } });

    const isStudent = student && document.studentId === student.id;
    const isTutor = tutor && document.tutorId === tutor.id;

    if (!isStudent && !isTutor) {
      return res.status(403).json({ status: "error", message: "You do not have access to this document" });
    }

    const signedUrl = await getSignedUrl(
      r2Client,
      new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: document.fileKey,
        ResponseContentDisposition: `attachment; filename="${document.fileName}"`,
      }),
      { expiresIn: 300 }
    );

    res.status(200).json({ status: "success", data: { url: signedUrl } });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to generate download URL", error: error.message });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const document = await prisma.document.findUnique({ where: { id } });

    if (!document) {
      return res.status(404).json({ status: "error", message: "Document not found" });
    }

    const student = await prisma.student.findFirst({ where: { userId } });
    const tutor = await prisma.tutor.findFirst({ where: { userId } });

    const isUploader =
      (student && document.uploadedByStudentId === student.id) ||
      (tutor && document.uploadedByTutorId === tutor.id);

    if (!isUploader) {
      return res.status(403).json({ status: "error", message: "Only the uploader can delete this document" });
    }

    await r2Client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET_NAME, Key: document.fileKey }));
    await prisma.document.delete({ where: { id } });

    res.status(200).json({ status: "success", message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Failed to delete document", error: error.message });
  }
};

export { uploadDocument, getDocuments, getDownloadUrl, deleteDocument };