import { prisma } from "../config/db.js";

export const requireStaffOrAdmin = (req, res, next) => {
  if (!req.userRole || !["STAFF", "ADMIN"].includes(req.userRole)) {
    return res.status(403).json({
      status: "error",
      message: "You don't have permission to perform this action.",
    });
  }
  next();
};
