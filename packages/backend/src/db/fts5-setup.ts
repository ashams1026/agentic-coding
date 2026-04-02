/**
 * FTS5 Full-Text Search setup — creates virtual tables and bridging tables
 * for full-text search across work items, personas, comments, and chat messages.
 *
 * FTS5 virtual tables require integer rowids, but Woof uses text IDs.
 * Bridging tables map between text IDs and integer rowids.
 *
 * This runs at startup and is idempotent (IF NOT EXISTS on all DDL).
 */

import { sqlite } from "./connection.js";
import { logger } from "../logger.js";

export function setupFts5(): void {
  logger.info("Setting up FTS5 virtual tables...");

  // ── Bridging tables (text ID → integer rowid) ──────────────────

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS fts_work_items_bridge (
      rowid INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS fts_personas_bridge (
      rowid INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS fts_comments_bridge (
      rowid INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS fts_chat_messages_bridge (
      rowid INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT NOT NULL UNIQUE
    );
  `);

  // ── FTS5 virtual tables ────────────────────────────────────────
  // content="" makes these external-content FTS tables (no duplicate storage)
  // We manage content via the bridging tables + source tables

  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS work_items_fts USING fts5(
      title,
      description,
      content_rowid=rowid
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS personas_fts USING fts5(
      name,
      system_prompt,
      content_rowid=rowid
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS comments_fts USING fts5(
      body,
      content_rowid=rowid
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS chat_messages_fts USING fts5(
      content,
      content_rowid=rowid
    );
  `);

  logger.info("FTS5 virtual tables ready");
}
