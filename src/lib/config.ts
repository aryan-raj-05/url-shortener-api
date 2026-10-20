import "dotenv/config";

export const config = {
  PORT: Number(process.env.PORT!) || 3001,
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET!,
};
