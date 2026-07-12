import dotenv from 'dotenv';
import { sendVerificationEmail } from './services/emailService.js';

dotenv.config();

const testMail = async () => {
  try {
    console.log('Sending test verification email to 17app.noreply@gmail.com...');
    const info = await sendVerificationEmail('17app.noreply@gmail.com', 'Odoo Tester', '987654');
    console.log('✔ Test email sent successfully!');
    console.log('Response Details:', info.response);
    console.log('Message ID:', info.messageId);
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    process.exit(1);
  }
};

testMail();
