// Lazy-load better-sqlite3 so the app keeps running when the native
// module isn't built (no Python/VS Build Tools on this machine).
// The driver layer (./index.js) automatically falls back to node:sqlite.
import { PRAGMA_SQL } from "../schema.js";

// Periodic checkpoint to keep WAL file small (avoid huge -wal/-shm growth)
const CHECKPOINT_INTERVAL_MS = 60 * 1000;

let _Database = null;
let _loadError = null;
function loadDatabase() {
  if (_Database) return _Database;
  if (_loadError) throw _loadError;
  try {
    // eslint-disable-next-line global-require
    _Database = require("better-sqlite3");
    return _Database;
  } catch (e) {
    _loadError = e;
    throw e;
  }
}

export function canUseBetterSqlite() {
  try {
    loadDatabase();
    return true;
  } catch {
    return false;
  }
}

export function createBetterSqliteAdapter(filePath) {
  const Database = loadDatabase();
  const db = new Database(filePath);
  db.exec(PRAGMA_SQL);
  // Schema is created/synced by migrate.js after adapter init

  const stmtCache = new Map();

  function prepare(sql) {
    let stmt = stmtCache.get(sql);
    if (!stmt) {
      stmt = db.prepare(sql);
      stmtCache.set(sql, stmt);
    }
    return stmt;
  }

  // Truncate WAL periodically so file stays small backup/copy
  const checkpointTimer = setInterval(() => {
    try { db.pragma("wal_checkpoint(TRUNCATE)"); } catch {}
  }, CHECKPOINT_INTERVAL_MS);
  if (typeof checkpointTimer.unref === "function") checkpointTimer.unref();

  function gracefulClose() {
    try { db.pragma("wal_checkpoint(TRUNCATE)"); } catch {}
    try { stmtCache.clear(); } catch {}
    try { db.close(); } catch {}
  }

  // Ensure WAL flushed -wal/-shm files removed on shutdown
  const onShutdown = () => gracefulClose();
  process.once("beforeExit", onShutdown);
  process.once("SIGINT", () => { onShutdown(); process.exit(0); });
  process.once("SIGTERM", () => { onShutdown(); process.exit(0); });

  return {
    driver: "better-sqlite3",
    raw: db,
    exec: (sql) => db.exec(sql),
    run: (sql, params = []) => {
      const stmt = prepare(sql);
      return stmt.run(...(Array.isArray(params) ? params : [params]));
    },
    get: (sql, params = []) => {
      const stmt = prepare(sql);
      return stmt.get(...(Array.isArray(params) ? params : [params]));
    },
    all: (sql, params = []) => {
      const stmt = prepare(sql);
      return stmt.all(...(Array.isArray(params) ? params : [params]));
    },
    transaction: (fn) => db.transaction(fn)(),
    pragma: (sql) => db.pragma(sql),
    close: () => {
      process.removeListener("beforeExit", onShutdown);
      process.removeListener("SIGINT", onShutdown);
      process.removeListener("SIGTERM", onShutdown);
      gracefulClose();
    },
  };
}
