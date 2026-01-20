import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param unsafe - The string to escape
 * @returns The escaped string safe for HTML insertion
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export function getWeeklyReportNotificationEmail(
  supervisorName: string,
  studentName: string,
  weekNumber: number,
  reviewUrl: string
) {
  // Sanitize all user-generated content to prevent XSS attacks
  const safeSupervisorName = escapeHtml(supervisorName);
  const safeStudentName = escapeHtml(studentName);
  const safeReviewUrl = escapeHtml(reviewUrl);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>SLIMS - ABU Zaria</h1>
          <p>SIWES Logbook Review Request</p>
        </div>
        <div class="content">
          <p>Dear ${safeSupervisorName},</p>
          <p>You have a new weekly report to review from <strong>${safeStudentName}</strong> for <strong>Week ${weekNumber}</strong>.</p>
          <p>Please click the button below to review and provide your comments:</p>
          <center>
            <a href="${safeReviewUrl}" class="button">Review Weekly Report</a>
          </center>
          <p>This is an automated notification from the SIWES Logbook & Internship Management System.</p>
        </div>
        <div class="footer">
          <p>Ahmadu Bello University, Zaria</p>
          <p>SIWES Unit</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
