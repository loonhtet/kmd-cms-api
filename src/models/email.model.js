import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
     host: process.env.EMAIL_HOST,
     port: process.env.EMAIL_PORT,
     secure: false,
     auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
     },
});

async function sendEmail({ to, subject, message }) {
     if (!to || !subject || !message) {
          throw new Error("Missing required fields");
     }

     const info = await transporter.sendMail({
          from: `"Email API" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          text: message,
          html: `<p>${message}</p>`,
     });

     return info.messageId;
}

export default sendEmail;
