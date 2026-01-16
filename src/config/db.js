import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client/index.js";
import { config } from "dotenv";

config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
     adapter,
     log:
          process.env.NODE_ENV === "development"
               ? ["query", "info", "warn", "error"]
               : ["error"],
});

const connectDB = async () => {
     try {
          await prisma.$connect();
          console.log("Connected to database");
     } catch (err) {
          console.error("Database connection failed", err);
          process.exit(1);
     }
};

const disconnectDB = async () => {
     await prisma.$disconnect();
};

export { prisma, connectDB, disconnectDB };
