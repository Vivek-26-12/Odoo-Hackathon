import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state on load
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        try {
          // Verify token and load user profile from backend
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else {
            // Clean up invalid session
            logoutState();
          }
        } catch (error) {
          console.error('Session validation error:', error.message);
          logoutState();
        }
      } else {
        logoutState();
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const logoutState = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // Login handler
  const loginUser = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        const { token, user: userData } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      }
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      throw new Error(message);
    }
  };

  // Register handler
  const registerUser = async (name, email, password, confirmPassword) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      throw new Error(message);
    }
  };

  // Verify email handler
  const verifyEmailOtp = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-email', { email, otp });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed. Please try again.';
      throw new Error(message);
    }
  };

  // Forgot password handler
  const forgotPasswordOtp = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP. Please try again.';
      throw new Error(message);
    }
  };

  // Reset password handler
  const resetPasswordWithOtp = async (email, otp, newPassword, confirmPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp,
        newPassword,
        confirmPassword
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Reset password failed. Please try again.';
      throw new Error(message);
    }
  };

  // Logout handler
  const logoutUser = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API warning:', error.message);
    } finally {
      logoutState();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginUser,
        registerUser,
        verifyEmailOtp,
        forgotPasswordOtp,
        resetPasswordWithOtp,
        logoutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
