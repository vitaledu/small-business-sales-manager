import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  
  // Business Constants
  returnableDepositValue: parseFloat(process.env.RETURNABLE_DEPOSIT_VALUE || '5.00'),
  currency: process.env.CURRENCY || 'BRL',
  timezone: process.env.TIMEZONE || 'America/Sao_Paulo',
  
  // Optional Security
  systemPin: process.env.SYSTEM_PIN || '',
};

export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';
