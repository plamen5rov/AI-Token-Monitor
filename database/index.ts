import Database from "better-sqlite3"
import path from "path"
import { runMigrations } from "./migrate"

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "atm.sqlite")

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma("journal_mode = WAL")
    db.pragma("foreign_keys = ON")
    runMigrations(db)
  }
  return db
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
  }
}
