import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  findUserByEmail,
  createUser,
  updateUserOTP,
  verifyUser,
  updatePassword
} from '../models/userModel.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';

// Helper to generate a 6-digit numeric OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register a new user
export const register = async (req, res, next) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validate input fields
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      // If user exists and is verified, reject
      if (existingUser.is_verified) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }
      
      // If user exists but is NOT verified, we will regenerate OTP and let them verify
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await updatePassword(email, passwordHash);
      await updateUserOTP(email, otp, otpExpiry);
      await sendVerificationEmail(email, name, otp);

      return res.status(200).json({
        success: true,
        message: 'Account was registered but unverified. A new verification OTP has been sent to your email.'
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate verification OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Save user to database
    await createUser({
      name,
      email,
      passwordHash,
      otp,
      otpExpiry
    });

    // Send verification email
    await sendVerificationEmail(email, name, otp);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email using the OTP sent to your inbox.'
    });
  } catch (error) {
    next(error);
  }
};

// Verify user email address with OTP
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ success: false, message: 'Email is already verified.' });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    // Check if OTP is expired
    const now = new Date();
    if (new Date(user.otp_expiry) < now) {
      return res.status(400).json({ success: false, message: 'Verification OTP has expired. Please request a new one.' });
    }

    // Verify user
    await verifyUser(email);

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

// Login user and sign JWT
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Only verified users can login
    if (!user.is_verified) {
      // Regenerate OTP and send email to make it smooth
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await updateUserOTP(user.email, otp, otpExpiry);
      await sendVerificationEmail(user.email, user.full_name, otp);

      return res.status(403).json({
        success: false,
        message: 'Your email is not verified. A new verification OTP has been sent to your email.'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        is_verified: user.is_verified,
        created_at: user.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

// Send OTP to email for resetting password
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      // For security purposes, keep it same or notify. In hackathon, clear messaging helps:
      return res.status(404).json({ success: false, message: 'No user account found with this email address.' });
    }

    // Generate reset OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await updateUserOTP(email, otp, otpExpiry);
    await sendPasswordResetEmail(email, user.full_name, otp);

    res.status(200).json({
      success: true,
      message: 'Password reset OTP has been sent to your email.'
    });
  } catch (error) {
    next(error);
  }
};

// Validate OTP and reset password
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if OTP matches
    if (user.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
    }

    // Check if OTP is expired
    const now = new Date();
    if (new Date(user.otp_expiry) < now) {
      return res.status(400).json({ success: false, message: 'Password reset OTP has expired. Please request a new one.' });
    }

    // Hash the new password and update
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await updatePassword(email, newPasswordHash);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    next(error);
  }
};

// Get profile details of currently logged-in user
export const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

// Log out user
export const logout = async (req, res, next) => {
  try {
    // Standard stateless JWT logout returns success response. Client removes local storage token.
    res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};
