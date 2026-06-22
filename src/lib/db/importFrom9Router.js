import fs from "node:fs";
import path from "node:path";
import os from "node:os";
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
  const p = path.join(getOrigDataDir(), "db", "data.sqlite");
  // node:sqlite (Node 22+) on Windows needs forward slashes
  if (process.platform === "win32") return p.replace(/\\/g, "/");
  return p;
}

/**
 * Read providerConnections and apiKeys from original 9router SQLite DB.
 * Uses node:sqlite if available (Node >= 22.5), otherwise better-sqlite3.
 * Called on first boot only. Marker file prevents re-import.
 */
export async function importFrom9RouterDb(adapter, dbDir) {
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

  let result;
  try {
    // Use node:sqlite (built-in Node 22.5+)
    const { DatabaseSync } = await import("node:sqlite");
    const origDb = new DatabaseSync(origDbPath);

    result = doImport(origDb, adapter);

    origDb.close();
  } catch (err) {
    // Fallback: better-sqlite3 via the project's runtime NODE_PATH
    console.log(`[DB][migrate] node:sqlite failed (${err.message}), trying better-sqlite3...`);
    try {
      const { createRequire } = await import("node:module");
      const require_ = createRequire(
        path.join(getOrigDataDir(), "..", "9router", "runtime", "node_modules", "better-sqlite3", "package.json")
      );
      const BetterSqlite3 = require_("better-sqlite3");
      const origDb = new BetterSqlite3(origDbPath, { readonly: true, fileMustExist: true });
      result = doImport(origDb, adapter);
      origDb.close();
    } catch (err2) {
      console.warn(`[DB][migrate] cannot open original 9router DB: ${err2.message}`);
      return false;
    }
  }

  if (result !== false) {
    try { fs.writeFileSync(markerPath, new Date().toISOString()); } catch {}
    console.log(`[DB][migrate] 9router import done (marker: ${markerPath})`);
    return true;
  }
  return false;
}

function doImport(origDb, adapter) {
  const isBetterSqlite = typeof origDb.prepare === "function";
  const isNodeSqlite = typeof origDb.prepare === "function" && origDb.prepare.length === 2;

  function qAll(sql) {
    if (isBetterSqlite) return origDb.prepare(sql).all();
    return origDb.prepare(sql).all();
  }

  function qGet(sql) {
    if (isBetterSqlite) return origDb.prepare(sql).get();
    return origDb.prepare(sql).get();
  }

  try {
    adapter.transaction(() => {
      // Check if we have tables
      const tables = qAll("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = new Set(tables.map(t => t.name));

      // Import providerConnections
      let connCount = 0;
      if (tableNames.has("providerConnections")) {
        try {
          const connections = qAll("SELECT * FROM providerConnections");
          for (const row of connections) {
            const data = (() => { try { return JSON.parse(row.data); } catch { return {}; } })();
            adapter.run(
              `INSERT OR REPLACE INTO providerConnections(id, provider, authType, name, email, priority, isActive, data, createdAt, updatedAt) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [row.id, row.provider, row.authType || "oauth", row.name || null, row.email || null, row.priority || null, row.isActive === false ? 0 : 1, stringifyJson(data), row.createdAt || new Date().toISOString(), row.updatedAt || new Date().toISOString()]
            );
            connCount++;
          }
        } catch (e) {
          console.warn(`[DB][migrate] providerConnections error: ${e.message}`);
        }
      }

      // Import apiKeys
      let keyCount = 0;
      if (tableNames.has("apiKeys")) {
        try {
          const keys = qAll("SELECT * FROM apiKeys");
          for (const row of keys) {
            adapter.run(
              `INSERT OR REPLACE INTO apiKeys(id, key, name, machineId, isActive, createdAt) VALUES(?, ?, ?, ?, ?, ?)`,
              [row.id, row.key, row.name || null, row.machineId || null, row.isActive === false ? 0 : 1, row.createdAt || new Date().toISOString()]
            );
            keyCount++;
          }
        } catch (e) {
          console.warn(`[DB][migrate] apiKeys error: ${e.message}`);
        }
      }

      // Import settings if none exist
      if (tableNames.has("settings")) {
        try {
          const existingSettings = adapter.get("SELECT id FROM settings WHERE id = 1");
          if (!existingSettings) {
            const settings = qGet("SELECT data FROM settings WHERE id = 1");
            if (settings?.data) {
              adapter.run("INSERT INTO settings(id, data) VALUES(1, ?)", [settings.data]);
            }
          }
        } catch {}
      }

      console.log(`[DB][migrate] Imported ${connCount} connections, ${keyCount} API keys from original 9router`);
    });

    return true;
  } catch (err) {
    console.error(`[DB][migrate] Failed to import from 9router: ${err.message}`);
    return false;
  }
}
