import nodemailer from "nodemailer";

import fs from "fs";

import path from "path";   // ✅ ADD THIS LINE
 
const transporter = nodemailer.createTransport({

  host: process.env.EMAIL_HOST,

  port: process.env.EMAIL_PORT,

  secure: false,

  auth: {

    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS,

  },

});
 
// Render HTML template

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
 
async function sendEmail({ to, subject, template, variables }) {

  if (!to || !subject || !template) {

    throw new Error("Missing required fields");

  }
 
  const html = renderTemplate(template, variables || {});
 
  const info = await transporter.sendMail({

    from: `"Email API" <${process.env.EMAIL_USER}>`,

    to,

    subject,

    html,

  });
 
  return info.messageId;

}
 
export default sendEmail;
 