import transporter from '../config/mail.js';

/**
 * Generates the HTML layout for emails
 * @param {string} title - Email subject/heading
 * @param {string} preheader - Preview text
 * @param {string} bodyContent - Core message
 * @param {string} otp - 6 digit OTP code
 * @param {string} duration - How long OTP is valid
 */
const getHtmlTemplate = (title, preheader, bodyContent, otp, duration = '10 minutes') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f6f9;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          border: 1px solid #eef2f6;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          padding: 30px 20px;
          text-align: center;
          color: #ffffff;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 40px 30px;
          color: #334155;
          line-height: 1.6;
        }
        .content h2 {
          margin-top: 0;
          color: #1e293b;
          font-size: 20px;
          font-weight: 600;
        }
        .otp-container {
          background: #f8fafc;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          text-align: center;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 6px;
          color: #4f46e5;
          margin: 0;
        }
        .info-note {
          font-size: 13px;
          color: #64748b;
          margin-top: 10px;
        }
        .footer {
          background-color: #f8fafc;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          border-top: 1px solid #f1f5f9;
        }
        .footer p {
          margin: 5px 0;
        }
        .btn-link {
          color: #4f46e5;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0;">${preheader}</span>
      <div class="container">
        <div class="header">
          <h1>OTP Initiate</h1>
        </div>
        <div class="content">
          <h2>${title}</h2>
          <p>${bodyContent}</p>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
            <div class="info-note">This code is valid for <strong>${duration}</strong>. Do not share this OTP with anyone.</div>
          </div>
          <p>If you did not request this, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
          <p>Sent securely by OTP Initiate Auth System</p>
          <p>&copy; 2026 Odoo Hackathon Starter App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Sends a registration verification OTP email
 * @param {string} email - Destination email
 * @param {string} name - User's full name
 * @param {string} otp - 6 digit verification OTP
 */
export const sendVerificationEmail = async (email, name, otp) => {
  const subject = 'Verify your email address - OTP Initiate';
  const preheader = 'Your email verification OTP code is inside.';
  const bodyContent = `Hello ${name},<br><br>Thank you for registering! To complete your signup and activate your account, please enter the 6-digit verification code below on the email verification page:`;

  const html = getHtmlTemplate('Email Verification', preheader, bodyContent, otp, '10 minutes');

  const mailOptions = {
    from: `"OTP Initiate Support" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: html
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Sends a password reset OTP email
 * @param {string} email - Destination email
 * @param {string} name - User's full name
 * @param {string} otp - 6 digit reset OTP
 */
export const sendPasswordResetEmail = async (email, name, otp) => {
  const subject = 'Reset your password - OTP Initiate';
  const preheader = 'Your password reset OTP code is inside.';
  const bodyContent = `Hello ${name},<br><br>We received a request to reset the password for your account. Please use the following 6-digit OTP code to complete your password reset:`;

  const html = getHtmlTemplate('Password Reset Request', preheader, bodyContent, otp, '10 minutes');

  const mailOptions = {
    from: `"OTP Initiate Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject,
    html: html
  };

  return transporter.sendMail(mailOptions);
};
