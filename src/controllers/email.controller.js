import { sendEmail } from "../services/email.service.js";

export const sendEmailController = async (req, res) => {
  try {
    const { to, type, variables } = req.body;

    if (!to || !type) {
      return res.status(400).json({
        success: false,
        error: "to and type are required",
      });
    }

    const info = await sendEmail({ to, type, variables });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
