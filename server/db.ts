import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

<<<<<<< HEAD
// Load DB config from environment
const dbConfig = {
  host: process.env.MYSQL_HOSTNAME || process.env.PGHOST,
  database: process.env.MYSQL_DBNAME || process.env.PGDATABASE,
  user: process.env.MYSQL_USER || process.env.PGUSER,
  password: process.env.MYSQL_PASSWORD || process.env.PGPASSWORD,
};

// Check if we have enough info for MySQL
const hasMysqlConfig = dbConfig.host && dbConfig.database && dbConfig.user && dbConfig.password;

let dbInstance: any;

if (hasMysqlConfig) {
  const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });
  dbInstance = drizzle(pool, { schema, mode: "default" });
} else if (process.env.DATABASE_URL) {
  // Fallback to PostgreSQL if DATABASE_URL is present
  const { drizzle: drizzlePg } = await import("drizzle-orm/node-postgres");
  const pg = await import("pg");
  const pool = new pg.default.Pool({ connectionString: process.env.DATABASE_URL });
  dbInstance = drizzlePg(pool, { schema });
} else {
  throw new Error(
    "Missing database environment variables. Please ensure MYSQL or POSTGRES environment variables are set.",
  );
}

export const db = dbInstance;
=======
const dbConfig = {
  host: process.env.MYSQL_HOSTNAME,
  database: process.env.MYSQL_DBNAME,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
};

if (!dbConfig.host || !dbConfig.database || !dbConfig.user || !dbConfig.password) {
  throw new Error(
    "Missing MySQL environment variables. Please ensure MYSQL_HOSTNAME, MYSQL_DBNAME, MYSQL_USER, and MYSQL_PASSWORD are set.",
  );
}

const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

export const db = drizzle(pool, { schema, mode: "default" });
>>>>>>> origin/main
