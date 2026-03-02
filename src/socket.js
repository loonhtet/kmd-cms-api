import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./config/db.js";

export function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", 
    },
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      let token;

      // Check for token in different locations
      if (socket.handshake.auth?.token) {
        token = socket.handshake.auth.token;
      } else if (socket.handshake.headers?.authorization?.startsWith("Bearer")) {
        token = socket.handshake.headers.authorization.split(" ")[1];
      } else if (socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error("Not authorized, no token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true },
      });

      if (!user) {
        return next(new Error("Not authorized, user not found"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error(`Not authorized: ${error.message}`));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id, "User ID:", socket.user.id);

    socket.on("join", () => {
      socket.join(`user_${socket.user.id}`);
      console.log(`User ${socket.user.id} joined room user_${socket.user.id}`);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}