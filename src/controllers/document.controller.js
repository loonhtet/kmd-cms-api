import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// GET /documents - Get all documents for a student or tutor
export const getDocuments = async (req: Request, res: Response) => {
  try {
    const { studentId, tutorId } = req.query;

    const documents = await prisma.document.findMany({
      where: {
        ...(studentId && { studentId: String(studentId) }),
        ...(tutorId && { tutorId: String(tutorId) }),
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        tutor: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ data: documents });
  } catch (error) {
    console.error("[getDocuments]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /documents/:id - Get a single document by ID
export const getDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        tutor: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    return res.status(200).json({ data: document });
  } catch (error) {
    console.error("[getDocument]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /documents - Upload a new document
export const createDocument = async (req: Request, res: Response) => {
  try {
    const { studentId, tutorId, title, file } = req.body;

    if (!studentId || !tutorId || !title || !file) {
      return res.status(400).json({ message: "studentId, tutorId, title, and file are required" });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const tutor = await prisma.tutor.findUnique({ where: { id: tutorId } });
    if (!tutor) {
      return res.status(404).json({ message: "Tutor not found" });
    }

    const document = await prisma.document.create({
      data: { studentId, tutorId, title, file },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        tutor: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    return res.status(201).json({ data: document, message: "Document uploaded successfully" });
  } catch (error) {
    console.error("[createDocument]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /documents/:id - Update a document title or file
export const updateDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, file } = req.body;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Document not found" });
    }

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(file && { file }),
      },
      include: {
        student: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
        tutor: {
          include: {
            user: {
              select: { id: true, name: true, email: true, image: true },
            },
          },
        },
      },
    });

    return res.status(200).json({ data: document, message: "Document updated successfully" });
  } catch (error) {
    console.error("[updateDocument]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /documents/:id - Delete a document
export const deleteDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.document.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Document not found" });
    }

    await prisma.document.delete({ where: { id } });

    return res.status(200).json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("[deleteDocument]", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};