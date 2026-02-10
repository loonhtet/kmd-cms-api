import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

///Create an email connection configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// verify connection once
transporter.verify((error) => {
  if (error) {
    console.error("Email server error:", error);
  } else {
    console.log("Email server ready");
  }
});

// Render HTML template
function renderTemplate(templateName, variables) {
  const templatePath = path.join(
    process.cwd(), 
    "src",
    "templates",
    templateName
  );

  //to read file
  let html = fs.readFileSync(templatePath, "utf-8");

  for (const key in variables) {
    const regex = new RegExp(`{{${key}}}`, "g");
    html = html.replace(regex, variables[key]);
  }

  return html;
}

export const sendEmailController = async (req, res) => {
  try {
    const { to, subject, variables } = req.body;

    if (!to || !subject) {
      return res.status(400).json({
        success: false,
        error: "to and subject are required",
      });
    }

    const html = renderTemplate("email-template.html", variables || {});

    const info = await transporter.sendMail({
      from: `"Email API" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

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

//For test
///For student
// {
//   "to": "student-email",
//   "subject": "New Student Assigned",
//   "variables": {
//     "tutorName": "John",
//     "studentName": "Lwin",
//     "message": "You have been assigned a new student.",
//     "buttonText": "Go to Dashboard",
//     "buttonUrl": "https://github.com/marketplace/models"
//   }
// }
// ///For tutor
// {
//   "to": "tutor1@gmail.com",
//   "subject": "New Students Assigned",
//   "variables": {
//     "tutorName": "Mr. Smith",
//     "students": [
//       { "name": "Alice" },
//       { "name": "Bob" },
//       { "name": "Charlie" },
//       { "name": "David" }
//     ],
//     "buttonText": "View Dashboard",
//     "buttonUrl": "https://yourwebsite.com/tutor-dashboard"
//   }
// }
