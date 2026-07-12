import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import validateEnv from './config/envValidator.js';
import pool from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import orgRoutes from './routes/orgRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import allocationRoutes from './routes/allocationRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables and validate
dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Auth routes
app.use('/api/auth', authRoutes);
app.use('/api/org', orgRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audits', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic health check route
app.get('/api/health', async (req, res, next) => {
  try {
    // Check database connection
    const [result] = await pool.query('SELECT 1 as connection_status');
    res.status(200).json({
      success: true,
      message: 'Server is healthy and database is connected.',
      database: result[0].connection_status === 1 ? 'Connected' : 'Disconnected'
    });
  } catch (error) {
    next(error);
  }
});

// Root fallback route
app.get('/', (req, res) => {
  res.send('Odoo Hackathon Auth System API is running.');
});

// Global Error Handler
app.use(errorHandler);

// Test database connection and start server
const startServer = async () => {
  try {
    // Try to acquire a connection from the pool
    const connection = await pool.getConnection();
    console.log('✔ Successfully verified database connection pool connectivity.');
    connection.release();

    if (process.env.NODE_ENV !== 'test') {
      app.listen(PORT, () => {
        console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('❌ Critical database connection failure:', error.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

startServer();

export default app;
