import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.cookies?.jwtToken) {
      token = req.cookies.jwtToken;
    } else if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: {
          // ✅ fetch role here directly
          select: {
            role: true,
          },
        },
      },
    });

    if (!req.user) {
      return res.status(401).json({
        status: "error",
        message: "Not authorized",
      });
    }

    req.userRole = req.user.role?.role || null; // ✅ attach role directly

    next();
  } catch (error) {
    res.status(401).json({
      status: "error",
      message: "Not authorized, token failed",
      error: error.message,
    });
  }
};

export { protect };
