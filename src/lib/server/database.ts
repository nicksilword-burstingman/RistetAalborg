import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

export function dataDirectory() {
  return path.resolve(
    /*turbopackIgnore: true*/
    process.env.RISTET_DATA_DIR || path.join(process.cwd(), ".data"),
  );
}

let database: DatabaseSync | undefined;
export function getDatabase() {
  if (!database) {
    mkdirSync(dataDirectory(), { recursive: true });
    database = new DatabaseSync(path.join(dataDirectory(), "ristet.sqlite"));
    initializeDatabase(database);
  }
  return database;
}

export function initializeDatabase(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS timeline_document (
      id INTEGER PRIMARY KEY CHECK(id = 1), revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS timeline_chapters (
      id TEXT PRIMARY KEY, period TEXT NOT NULL, date_time TEXT NOT NULL,
      title TEXT NOT NULL, body TEXT NOT NULL, sort_order INTEGER NOT NULL,
      is_future INTEGER NOT NULL CHECK(is_future IN (0,1))
    );
    CREATE TABLE IF NOT EXISTS timeline_images (
      id TEXT PRIMARY KEY, chapter_id TEXT NOT NULL REFERENCES timeline_chapters(id) ON DELETE CASCADE,
      src TEXT NOT NULL, alt TEXT NOT NULL, caption TEXT NOT NULL,
      width INTEGER NOT NULL, height INTEGER NOT NULL,
      focus_x REAL NOT NULL, focus_y REAL NOT NULL, crop TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY, width INTEGER NOT NULL, height INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY, credential_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role = 'owner'), expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS login_attempts (
      id INTEGER PRIMARY KEY, attempted_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS checkout_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1), document TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS commerce_orders (
      id TEXT PRIMARY KEY, number TEXT NOT NULL UNIQUE,
      owner_hash TEXT NOT NULL, request_id TEXT NOT NULL, payload_hash TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('test','live')),
      mobilepay INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','expired')),
      customer TEXT NOT NULL, quote TEXT NOT NULL, site_url TEXT NOT NULL,
      terms_version TEXT NOT NULL, created_at INTEGER NOT NULL, paid_at INTEGER,
      stripe_session_id TEXT UNIQUE, stripe_checkout_url TEXT,
      payment_intent_id TEXT UNIQUE, refunded_ore INTEGER NOT NULL DEFAULT 0,
      fulfillment TEXT NOT NULL DEFAULT 'unfulfilled' CHECK(fulfillment IN ('unfulfilled','shipped')),
      UNIQUE(owner_hash, request_id)
    );
    CREATE INDEX IF NOT EXISTS commerce_orders_created ON commerce_orders(created_at);
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES commerce_orders(id),
      type TEXT NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS commerce_outbox (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES commerce_orders(id),
      kind TEXT NOT NULL, created_at INTEGER NOT NULL,
      processed_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS checkout_attempts (
      id INTEGER PRIMARY KEY, owner_hash TEXT NOT NULL, attempted_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscription_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1), document TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customer_profiles (
      user_id TEXT PRIMARY KEY, address TEXT, subscriptions TEXT NOT NULL DEFAULT '[]', updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS commerce_customer_links (
      order_id TEXT PRIMARY KEY REFERENCES commerce_orders(id), user_id TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS commerce_customer_user ON commerce_customer_links(user_id);
    CREATE TABLE IF NOT EXISTS customer_auth_attempts (
      id INTEGER PRIMARY KEY, key TEXT NOT NULL, attempted_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS customer_auth_attempt_key ON customer_auth_attempts(key, attempted_at);
  `);
}
