import multer from "multer";

const storage = multer.memoryStorage();

// Set global limits for this upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const documentStorage = multer.memoryStorage();

export const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
// Middleware to handle file upload errors
export const handleDocumentUploadErrors = (req, res, next) => {
  uploadDocument.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          status: "error",
          message: "File too big! Max 10MB.",
        });
      }
      // Handle other Multer errors
      return res.status(400).json({
        status: "error",
        message: err.message,
      });
    }
    next(err); // pass unknown errors
  });
};
