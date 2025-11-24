const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.logOnly = false;
    this.transporter = null;
    this._initializeTransporter();
  }

  _initializeTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_SECURE } =
      process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) {
      this.logOnly = true;
      console.warn(
        "EmailService: SMTP configuration missing. Falling back to console logging."
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: SMTP_SECURE ? SMTP_SECURE === "true" : Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }

  async sendPasswordResetEmail(recipientEmail, resetLink) {
    const subject = "Cartify Password Reset";
    const textContent =
      `You requested a password reset for your Cartify account.\n\n` +
      `Click the link below to choose a new password. This link will expire in 1 hour.\n\n${resetLink}\n\n` +
      `If you did not request this change, you can safely ignore this email.`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif;">
        <p>Hello,</p>
        <p>You requested a password reset for your <strong>Cartify</strong> account.</p>
        <p>Click the button below to set a new password. This link is valid for the next hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetLink}" style="background: #163D7A; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">
            Reset your password
          </a>
        </p>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p style="margin-top: 32px;">If you did not request this change, you can safely ignore this email.</p>
        <p style="margin-top: 24px;">— The Cartify Team</p>
      </div>
    `;

    if (this.logOnly || !this.transporter) {
      console.info(
        "EmailService: Logging password reset email instead of sending.",
        {
          to: recipientEmail,
          subject,
          resetLink,
        }
      );
      return;
    }

    await this.transporter.sendMail({
      from:
        process.env.SMTP_FROM || `Cartify Support <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject,
      text: textContent,
      html: htmlContent,
    });
  }
}

module.exports = new EmailService();
