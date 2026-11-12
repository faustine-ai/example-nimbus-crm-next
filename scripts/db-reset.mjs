// Delete the local SQLite database. It is recreated, migrated and seeded with
// the demo data the next time the app reads from it.
//
//   npm run db:reset
//
// Stop the dev server first: a running server keeps the old file open.

import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH || path.join(process.cwd(), "data", "crm.db");

let removed = 0;
for (const file of [dbPath, `${dbPath}-wal`, `${dbPath}-shm`]) {
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    removed += 1;
  }
}

console.log(
  removed
    ? `Removed ${path.relative(process.cwd(), dbPath)}. A fresh database is seeded on the next start.`
    : "No database found. One is created and seeded on the next start.",
);
