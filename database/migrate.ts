import fs from "fs"
import path from "path"
import Database from "better-sqlite3"

export function runMigrations(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL UNIQUE,
      applied_at INTEGER NOT NULL
    );
  `)

  const migrationsDir = path.join(process.cwd(), "migrations")
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()

  const check = db.prepare("SELECT 1 FROM _migrations WHERE filename = ?")
  const insert = db.prepare(
    "INSERT INTO _migrations (filename, applied_at) VALUES (?, ?)"
  )

  for (const file of files) {
    const alreadyApplied = check.get(file)
    if (alreadyApplied) continue

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8")
    db.exec(sql)
    insert.run(file, Date.now())
  }
}
