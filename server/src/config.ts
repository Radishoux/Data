export const config = {
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/data-app',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: '30d',
  port: Number(process.env.PORT) || 3000,
  resetTokenExpiresIn: 3600000, // 1 hour in ms
};
