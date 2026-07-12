import dotenv from 'dotenv';

// Load variables if not already done
dotenv.config();

export const validateEnv = () => {
  const isTest = process.env.NODE_ENV === 'test';
  
  const requiredCore = ['JWT_SECRET'];
  
  // Database configuration validation
  if (!process.env.DATABASE_URL) {
    requiredCore.push('DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME');
  }

  // Integrations required in development/production but skipped in test runs
  const requiredProductionIntegrations = [
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'EMAIL_USER',
    'EMAIL_PASS'
  ];

  const missing = [];

  // Check core variables
  for (const key of requiredCore) {
    if (!process.env[key] || process.env[key].trim() === '') {
      missing.push(key);
    }
  }

  // Check production integrations if not running in test mode
  if (!isTest) {
    for (const key of requiredProductionIntegrations) {
      if (!process.env[key] || process.env[key].trim() === '') {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    console.error('========================================================================');
    console.error('❌ FATAL STARTUP FAILURE: Missing Required Environment Variables!');
    console.error('Please configure the following values in your .env file:');
    console.error('------------------------------------------------------------------------');
    missing.forEach(variable => {
      console.error(`  ↳  ${variable}`);
    });
    console.error('========================================================================');
    process.exit(1);
  } else {
    console.log('✔ Environment configuration verification successful.');
  }
};

export default validateEnv;
