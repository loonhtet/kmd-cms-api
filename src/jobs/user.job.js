import cron from "node-cron";
import { prisma } from "../config/db.js";

const INACTIVE_DAYS = 2;
const EMAIL_COOLDOWN_DAYS = 1; // weekly, so don't resend within 7 days

const userJob = () => {
  // Runs every Monday at 9:00 AM
  cron.schedule("0 9 * * 1", async () => {
    console.log("Running inactive user check...");

    try {
      const now = new Date();

      const inactiveThreshold = new Date(now);
      inactiveThreshold.setDate(inactiveThreshold.getDate() - INACTIVE_DAYS);

      const emailCooldown = new Date(now);
      emailCooldown.setDate(emailCooldown.getDate() - EMAIL_COOLDOWN_DAYS);

      // Find users who:
      // 1. lastActive is older than 28 days (or never active)
      // 2. haven't been sent this email in the last 7 days
      const inactiveUsers = await prisma.user.findMany({
        where: {
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
        },
      });

      if (inactiveUsers.length === 0) {
        console.log("No inactive users found.");
        return;
      }

      console.log(`Found ${inactiveUsers.length} inactive users.`);

      // Send emails and update lastInactiveEmailSent
      await Promise.all(
        inactiveUsers.map(async (user) => {
          try {
            console.log(`Sending email to ${user.email}`);
            // await sendEmail({
            //   to: user.email,
            //   subject: "We miss you!",
            //   html: `
            //     <h2>Hi ${user.name},</h2>
            //     <p>We noticed you haven't been active for a while.</p>
            //     <p>Come back and check what's new!</p>
            //   `,
            // });

            await prisma.user.update({
              where: { id: user.id },
              data: { lastInactiveEmailSent: now },
            });

            console.log(`Email sent to ${user.email}`);
          } catch (err) {
            console.error(
              `Failed to send email to ${user.email}:`,
              err.message,
            );
          }
        }),
      );

      console.log("Inactive user job completed.");
    } catch (error) {
      console.error("Inactive user job failed:", error.message);
    }
  });
};

export default userJob;
