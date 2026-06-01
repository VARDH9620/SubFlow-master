import "dotenv/config";
import { PrismaClient } from '../prisma/generated/client/index.js';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("CRITICAL ERROR: DATABASE_URL environment variable is missing!");
}

let cleanConnectionString = connectionString || "postgresql://invalid:invalid@localhost/invalid";
let sslConfig: any = undefined;

if (connectionString) {
  try {
    const url = new URL(connectionString);
    const hasSslMode = url.searchParams.has('sslmode');
    
    // If it's a remote database requesting SSL or we are running in production/Vercel,
    // bypass certificate verification for self-signed certificates.
    if (hasSslMode || process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      sslConfig = { rejectUnauthorized: false };
    }
    
    // Remove parameters that override node-postgres custom SSL config object
    url.searchParams.delete('sslmode');
    url.searchParams.delete('ssl');
    url.searchParams.delete('sslcert');
    url.searchParams.delete('sslkey');
    url.searchParams.delete('sslrootcert');
    cleanConnectionString = url.toString();
  } catch (e) {
    console.error("Failed to parse DATABASE_URL:", e);
  }
}

const pool = new pg.Pool({ 
  connectionString: cleanConnectionString,
  ssl: sslConfig
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;
