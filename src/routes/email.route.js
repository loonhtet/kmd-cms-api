import { Router } from "express";
import { sendEmail } from "../models/email.model";

const router = Router();

router.post("/send-email", async (req, res) => {
     try {
          const { to, subject, message } = req.body;

          const messageId = await sendEmail({ to, subject, message });

          res.status(200).json({
               success: true,
               message: "Email sent successfully",
               messageId,
          });
     } catch (error) {
          res.status(400).json({
               success: false,
               error: error.message,
          });
     }
});

export default router;
