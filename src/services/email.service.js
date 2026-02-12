// email.service.js
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function renderTemplate(templateName, variables) {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "templates",
    templateName
  );

  let html = fs.readFileSync(templatePath, "utf-8");

  for (const key in variables) {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, variables[key]);
  }

  return html;
}

export const sendEmail = async ({ to, type, variables }) => {
  let subject;
  let template;

  if (type === "student-assigned") {
    subject = "Personal Tutor Assigned";
    template = "student-assigned.html";
  } else if (type === "tutor-assigned") {
    subject = "New Student Assigned";
    template = "tutor-assigned.html";
  } else if (type === "otp") {
    subject = "OTP Code";
    template = "otp.html";
  } else {
    throw new Error("Invalid email type");
  }

  const html = renderTemplate(template, variables || {});

  return await transporter.sendMail({
    from: `<${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};
