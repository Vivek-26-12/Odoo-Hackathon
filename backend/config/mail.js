import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Nodemailer SMTP connection verification failed:', error.message);
  } else {
    console.log('✔ Nodemailer SMTP transporter is ready to send emails.');
  }
});

export default transporter;
