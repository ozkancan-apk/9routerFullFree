import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createRequire } from "node:module";
import { stringifyJson } from "./helpers/jsonCol.js";

const ORIG_APP_NAME = "9router";
const MIGRATED_MARKER = ".imported-from-9router";

function getOrigDataDir() {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming"), ORIG_APP_NAME);
  }
  return path.join(os.homedir(), `.${ORIG_APP_NAME}`);
}

function getOrigDbPath() {
  return path.join(getOrigDataDir(), "db", "data.sqlite");
}

/**
 * Import providerConnections and apiKeys from original 9router SQLite DB.
 * Runs only once on fresh DB. Marker file prevents re-import.
 * Uses better-sqlite3 (or node:sqlite 22+) to read the source DB.
 */
export function importFrom9RouterDb(adapter, dbDir) {
  const markerPath = path.join(dbDir, MIGRATED_MARKER);
  if (fs.existsSync(markerPath)) {
    return false;
  }

  const origDbPath = getOrigDbPath();
  if (!fs.existsSync(origDbPath)) {
    return false;
  }

  console.log(`[DB][migrate] Found original 9router DB at ${origDbPath}`);
  console.log(`[DB][migrate] Importing provider connections and API keys...`);

  let origDb = null;
  try {
    // Try Node 22+ built-in node:sqlite (ESM-safe, no native deps)
    const require = createRequire(import.meta.url);
    try {
      const { DatabaseSync } = require("node:sqlite");
      origDb = new DatabaseSync(origDbPath, { readOnly: true, allowLoadExtension: false });
    } catch {
      // Fallback to better-sqlite3 (installed via runtime)
      const BetterSqlite3 = createRequire(origDbPath)("better-sqlite3");
      origDb = new BetterSqlite3(origDbPath, { readonly: true, fileMustExist: true });
    }
  } catch (err) {
    console.warn(`[DB][migrate] Cannot open original 9router DB: ${err.message}`);
    return false;
  }

  function queryAll(sql) {
    if (typeof origDb.prepare === "function") {
      // better-sqlite3
      return origDb.prepare(sql).all();
    }
    // node:sqlite
    const stmt = origDb.prepare(sql);
    const rows = stmt.all();
    stmt.free?.();
    return rows;
  }

  function queryGet(sql) {
    if (typeof origDb.prepare === "function") {
      // better-sqlite3
      return origDb.prepare(sql).get();
    }
    // node:sqlite
    const stmt = origDb.prepare(sql);
    const row = stmt.get();
    stmt.free?.();
    return row || null;
  }

  try {
    adapter.transaction(() => {
      // Import providerConnections
      let connCount = 0;
      try {
        const connections = queryAll("SELECT * FROM providerConnections");
        for (const row of connections) {
          const data = (() => { try { return JSON.parse(row.data); } catch { return {}; } })();
          adapter.run(
            `INSERT OR REPLACE INTO providerConnections(id, provider, authType, name, email, priority, isActive, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.id, row.provider, row.authType || "oauth", row.name || null, row.email || null, row.priority || null, row.isActive === false ? 0 : 1, stringifyJson(data), row.createdAt || new Date().toISOString(), row.updatedAt || new Date().toISOString()]
          );
          connCount++;
        }
      } catch (e) {
        console.warn(`[DB][migrate] providerConnections not found in source: ${e.message}`);
      }

      // Import apiKeys
      let keyCount = 0;
      try {
        const keys = queryAll("SELECT * FROM apiKeys");
        for (const row of keys) {
          adapter.run(
            `INSERT OR REPLACE INTO apiKeys(id, key, name, machineId, isActive, createdAt) VALUES(?, ?, ?, ?, ?, ?)`,
            [row.id, row.key, row.name || null, row.machineId || null, row.isActive === false ? 0 : 1, row.createdAt || new Date().toISOString()]
          );
          keyCount++;
        }
      } catch (e) {
        console.warn(`[DB][migrate] apiKeys not found in source: ${e.message}`);
      }

      // Import settings if none exist
      try {
        const existingSettings = adapter.get("SELECT id FROM settings WHERE id = 1");
        if (!existingSettings) {
          const settings = queryGet("SELECT data FROM settings WHERE id = 1");
          if (settings?.data) {
            adapter.run("INSERT INTO settings(id, data) VALUES(1, ?)", [settings.data]);
          }
        }
      } catch {}

      console.log(`[DB][migrate] Imported ${connCount} connections, ${keyCount} API keys from original 9router`);
    });

    try { fs.writeFileSync(markerPath, new Date().toISOString()); } catch {}
    return true;
  } catch (err) {
    console.error(`[DB][migrate] Failed to import from 9router: ${err.message}`);
    return false;
  } finally {
    try { origDb.close?.(); } catch {}
  }
}
