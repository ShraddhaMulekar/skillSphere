import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const sendEmail = async ({ to, subject, html, verificationCode }) => {
  // Always log to local mock file for developer ease
  try {
    const logsDir = path.join(__dirname, "../logs");
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const logFilePath = path.join(logsDir, "mock_emails.log");
    
    // Extract any links/URLs from the HTML for easy copying
    const urlRegex = /href="([^"]+)"/g;
    const links = [];
    let match;
    while ((match = urlRegex.exec(html)) !== null) {
      links.push(match[1]);
    }
    
    const logEntry = `
========================================
[${new Date().toISOString()}] EMAIL SENT
To: ${to}
Subject: ${subject}
${links.length > 0 ? `Links Found:\n${links.map(l => `  - ${l}`).join("\n")}` : ""}
---------------------------
Body:
${html.replace(/<[^>]*>/g, " ").trim()}
verificationCode: ${verificationCode || "N/A"}
========================================
\n`;
    fs.appendFileSync(logFilePath, logEntry, "utf8");
    console.log(`[Email Logged] Saved mock copy to backend/logs/mock_emails.log`);
  } catch (err) {
    console.error("Failed to write to mock email log file:", err.message);
  }

  // Check if we should bypass SMTP sending
  if (process.env.BYPASS_EMAIL === "true") {
    console.log(`[Email Bypassed] SMTP sending bypassed. Check backend/logs/mock_emails.log for the link.`);
    return;
  }

  // Build transporter config — prefer service: 'gmail' when host is Gmail
  const host = process.env.EMAIL_HOST;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  let transporterConfig;

  if (host && host.toLowerCase().includes("gmail")) {
    // Use nodemailer's built-in Gmail service for more reliable delivery
    transporterConfig = {
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    };
  } else {
    // Generic SMTP config for non-Gmail providers
    const port = Number(process.env.EMAIL_PORT || 587);
    const secure = port === 465;
    transporterConfig = {
      host: host || undefined,
      port,
      secure,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    };
  }

  const transporter = nodemailer.createTransport(transporterConfig);

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"SkillSphere" <${emailUser}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email OK] Sent to ${to} | messageId: ${info.messageId}`);
  } catch (smtpError) {
    console.error(`[Email SMTP ERROR] Failed to send to ${to}:`, smtpError.message);
    console.error(`[Email SMTP ERROR] Full details:`, smtpError);
    throw smtpError; // re-throw so the caller knows it failed
  }
};
