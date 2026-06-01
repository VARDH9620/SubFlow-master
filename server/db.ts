import "dotenv/config";
import { PrismaClient } from '../prisma/generated/client/index.js';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("CRITICAL ERROR: DATABASE_URL environment variable is missing!");
}

const pool = new pg.Pool({ 
  connectionString: connectionString || "postgresql://invalid:invalid@localhost/invalid",
  ssl: process.env.NODE_ENV === 'production' || process.env.VERCEL ? { rejectUnauthorized: false } : undefined
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
