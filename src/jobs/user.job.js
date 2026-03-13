import cron from "node-cron";
import { prisma } from "../config/db.js";

const INACTIVE_DAYS = 28;
const EMAIL_COOLDOWN_DAYS = 7;

export const runJob = async () => {
  // Runs every Monday at 9:00 AM
  // cron.schedule("0 9 * * 1", async () => {
  cron.schedule("*/10 * * * *", async () => {
    console.log("Running inactive student check...");
    try {
      const now = new Date();
      const inactiveThreshold = new Date(now);
      inactiveThreshold.setDate(inactiveThreshold.getDate() - INACTIVE_DAYS);
      const emailCooldown = new Date(now);
      emailCooldown.setDate(emailCooldown.getDate() - EMAIL_COOLDOWN_DAYS);

      // Find students who:
      // 1. lastActive is older than 28 days (or never active)
      // 2. haven't been sent this email in the last 7 days
      const inactiveStudents = await prisma.user.findMany({
        where: {
          studentProfile: { isNot: null },
          AND: [
            {
              OR: [
                { lastActive: { lte: inactiveThreshold } },
                { lastActive: null },
              ],
            },
            {
              OR: [
                { lastInactiveEmailSent: { lte: emailCooldown } },
                { lastInactiveEmailSent: null },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          lastActive: true,
          studentProfile: {
            select: {
              tutor: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (inactiveStudents.length === 0) {
        console.log("No inactive students found.");
        return;
      }

      console.log(`Found ${inactiveStudents.length} inactive students.`);

      await Promise.all(
        inactiveStudents.map(async (user) => {
          try {
            const tutor = user.studentProfile?.tutor?.user ?? null;
            const student = { name: user.name, email: user.email };

            // Send email to student
            await sendEmail({
              to: user.email,
              type: "inactive-warning",
              variables: {
                tutorName: tutor?.name ?? null,
                studentName: student.name,
                studentEmail: student.email,
              },
            });
            console.log(`Inactive warning sent to student ${user.email}`);

            // Send email to assigned tutor (if exists)
            if (tutor) {
              await sendEmail({
                to: tutor.email,
                type: "inactive-warning-to-tutor",
                variables: {
                  tutorName: tutor.name,
                  studentName: student.name,
                  studentEmail: student.email,
                },
              });
              console.log(`Inactive warning sent to tutor ${tutor.email}`);
            } else {
              console.log(
                `Student ${user.email} has no assigned tutor, skipping tutor email.`,
              );
            }

            // Update cooldown timestamp
            await prisma.user.update({
              where: { id: user.id },
              data: { lastInactiveEmailSent: now },
            });
          } catch (err) {
            console.error(
              `Failed to process inactive student ${user.email}:`,
              err.message,
            );
          }
        }),
      );

      console.log("Inactive student job completed.");
    } catch (error) {
      console.error("Inactive student job failed:", error.message);
    }
  });
};

const userJob = () => {
  cron.schedule("0 9 * * 1", runJob);
};

export default userJob;
