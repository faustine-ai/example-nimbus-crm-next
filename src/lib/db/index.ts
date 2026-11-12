import "server-only";

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

import { migrate } from "./migrate";
import { seed } from "./seed";

export type DB = Database.Database;

// Database file location. Configurable so a container can mount a volume.
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), "data", "crm.db");
const SCHEMA_PATH = path.join(process.cwd(), "db", "schema.sql");

// Keep a single connection per process. `globalThis` survives the module
// reloads of `next dev`, so hot reloading does not leak connections.
const globalForDb = globalThis as unknown as { __nimbusDb?: DB };

function open(): DB {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create the tables, run migrations and seed demo data on first run.
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));
  migrate(db);
  seed(db);

  return db;
}

/**
 * The SQLite connection. Opened lazily on first use, which is when the
 * database is created, migrated and seeded.
 *
 * Only the data access layer (src/lib/dal) and the Server Actions
 * (src/lib/actions) should call this.
 */
export function getDb(): DB {
  if (!globalForDb.__nimbusDb) {
    globalForDb.__nimbusDb = open();
  }
  return globalForDb.__nimbusDb;
}
