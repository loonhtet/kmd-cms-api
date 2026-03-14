import cron from "node-cron";
import { prisma } from "../config/db.js";
import { sendEmail } from "../services/email.service.js";

const INACTIVE_DAYS = 28;
const EMAIL_COOLDOWN_DAYS = 7;

export const runJob = async () => {
  const now = new Date();

  const inactiveThreshold = new Date(now);
  inactiveThreshold.setDate(inactiveThreshold.getDate() - INACTIVE_DAYS);

  const emailCooldown = new Date(now);
  emailCooldown.setDate(emailCooldown.getDate() - EMAIL_COOLDOWN_DAYS);

  const inactiveStudents = await prisma.user.findMany({
    where: {
      studentProfile: { isNot: null },
      AND: [
        { lastActive: { lte: inactiveThreshold } },
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

  if (inactiveStudents.length === 0) return;

  for (const user of inactiveStudents) {
    try {
      const tutor = user.studentProfile?.tutor?.user ?? null;
      const student = { name: user.name, email: user.email };

      await sendEmail({
        to: user.email,
        type: "inactive-warning",
        variables: {
          tutorName: tutor?.name ?? null,
          studentName: student.name,
          studentEmail: student.email,
        },
      });

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
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastInactiveEmailSent: now },
      });

      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (err) {
      console.error(
        `Failed to process inactive student ${user.email}:`,
        err.message,
      );
    }
  }
};

const userJob = () => {
  cron.schedule("0 9 * * 1", runJob, {
    timezone: "Asia/Bangkok",
  });
};

export default userJob;
