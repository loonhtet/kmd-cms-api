import { prisma } from "../src/config/db.js";
import bcrypt from "bcrypt";

const admins = [
     {
          id: "9a992036-01c3-47f3-b4e1-1821e889126e",
          name: "SuperAdmin",
          email: "superadmin@gmail.com",
          password: "superadmin123",
          role: "SUPER_ADMIN",
          register: true,
     },
     {
          id: "9a992036-01c3-47f3-b4e1-1821e889126d",
          name: "Admin",
          email: "admin@gmail.com",
          password: "admin123",
          role: "ADMIN",
          register: true,
     },
];

const main = async () => {
     console.log("SEEDING...");
     try {
          const hashedAdmins = await Promise.all(
               admins.map(async (admin) => ({
                    ...admin,
                    password: await bcrypt.hash(admin.password, 10),
               })),
          );

          await prisma.admin.createMany({
               data: hashedAdmins,
               skipDuplicates: true,
          });

          console.log("✓ Seeded admins successfully");
     } catch (error) {
          console.error("✗ Seeding failed:", error);
          process.exit(1);
     } finally {
          console.log("SEEDING COMPLETED");
          await prisma.$disconnect();
     }
};

main();
