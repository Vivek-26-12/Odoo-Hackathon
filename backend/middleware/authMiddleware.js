import jwt from 'jsonwebtoken';
import { findUserById } from '../models/userModel.js';

const protect = async (req, res, next) => {
  let token;

  // Check if header contains Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (excluding sensitive fields like password_hash)
      const user = await findUserById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: User no longer exists.'
        });
      }

      if (!user.is_verified) {
        return res.status(403).json({
          success: false,
          message: 'Access forbidden: Email is not verified.'
        });
      }

      // Attach user object to request
      req.user = user;
      next();
    } catch (error) {
      console.error('❌ JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Invalid or expired token.'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No token provided.'
    });
  }
};

export default protect;
