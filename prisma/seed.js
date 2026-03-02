import { prisma } from "../src/config/db.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("Starting seed...");

  // Hash passwords
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create admin staff user
  const adminStaff = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin Staff",
      password: hashedPassword,
      image: null,
      role: {
        create: {
          role: "ADMIN",
        },
      },
      staffProfile: {
        create: {
          isAdmin: true,
        },
      },
    },
  });
  console.log("Admin staff user created:", adminStaff);

  // Create regular staff user
  const regularStaff = await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      email: "staff@example.com",
      name: "Regular Staff",
      password: hashedPassword,
      image: null,
      role: {
        create: {
          role: "STAFF",
        },
      },
      staffProfile: {
        create: {
          isAdmin: false,
        },
      },
    },
  });
  console.log("Regular staff user created:", regularStaff);

  // Create tutor user
  const tutor = await prisma.user.upsert({
    where: { email: "tutor@example.com" },
    update: {},
    create: {
      email: "tutor@example.com",
      name: "John Tutor",
      password: hashedPassword,
      image: null,
      role: {
        create: {
          role: "TUTOR",
        },
      },
      tutorProfile: {
        create: {},
      },
    },
  });
  console.log("Tutor user created:", tutor);

  // Create student user
  const student = await prisma.user.upsert({
    where: { email: "student@example.com" },
    update: {},
    create: {
      email: "student@example.com",
      name: "Jane Student",
      password: hashedPassword,
      image: null,
      role: {
        create: {
          role: "STUDENT",
        },
      },
      studentProfile: {
        create: {},
      },
    },
  });
  console.log("Student user created:", student);

  // Create another tutor
  const tutor2 = await prisma.user.upsert({
    where: { email: "tutor2@example.com" },
    update: {},
    create: {
      email: "tutor2@example.com",
      name: "Sarah Tutor",
      password: hashedPassword,
      image: null,
      role: {
        create: {
          role: "TUTOR",
        },
      },
      tutorProfile: {
        create: {},
      },
    },
  });
  console.log("Second tutor user created:", tutor2);

  // Create students and assign to tutors
  const student2 = await prisma.user.upsert({
    where: { email: "student2@example.com" },
    update: {},
    create: {
      email: "student2@example.com",
      name: "Mike Student",
      password: hashedPassword,
      image: null,
      role: {
        create: {
          role: "STUDENT",
        },
      },
      studentProfile: {
        create: {
          tutorId: tutor.tutorProfile?.id,
        },
      },
    },
  });
  console.log("Second student user created and assigned to tutor:", student2);

  const student3 = await prisma.user.upsert({
    where: { email: "student3@example.com" },
    update: {},
    create: {
      email: "student3@example.com",
      name: "Emily Student",
      password: hashedPassword,
      image: null,
      role: {
        create: {
          role: "STUDENT",
        },
      },
      studentProfile: {
        create: {
          tutorId: tutor.tutorProfile?.id,
        },
      },
    },
  });
  console.log("Third student user created and assigned to tutor:", student3);

  await prisma.sidebar.deleteMany();

  // Seed sidebar permissions
  const sidebarPermissions = {
    STUDENT: ["messages", "meetings", "documents", "blog"],
    TUTOR: ["messages", "meetings", "documents", "blog"],
    STAFF: ["dashboard", "blog", "allocate tutor", "account"],
    ADMIN: ["dashboard", "blog", "allocate tutor", "account"],
  };

  const permissionsData = Object.entries(sidebarPermissions).flatMap(
    ([role, tabs]) => tabs.map((tab) => ({ role, tab })),
  );

  const { count } = await prisma.sidebar.createMany({
    data: permissionsData,
    skipDuplicates: true,
  });
  console.log(`Sidebar permissions seeded: ${count} records inserted`);

  console.log("\n=== Seed Summary ===");
  console.log("All users password: password123");
  console.log("\nCreated users:");
  console.log("1. Admin Staff - admin@example.com");
  console.log("2. Regular Staff - staff@example.com");
  console.log("3. Tutor - tutor@example.com");
  console.log("4. Tutor 2 - tutor2@example.com");
  console.log("5. Student - student@example.com");
  console.log("6. Student 2 - student2@example.com (assigned to John Tutor)");
  console.log("7. Student 3 - student3@example.com (assigned to John Tutor)");
  console.log("\nSidebar permissions seeded for: STUDENT, TUTOR, STAFF, ADMIN");
  console.log("===================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
