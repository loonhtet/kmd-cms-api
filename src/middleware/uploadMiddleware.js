import multer from "multer";

const storage = multer.memoryStorage();

// Set global limits for this upload instance
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});