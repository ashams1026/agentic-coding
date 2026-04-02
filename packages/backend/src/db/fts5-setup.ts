/**
 * FTS5 Full-Text Search setup — creates virtual tables, bridging tables,
 * sync triggers, and performs initial backfill.
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

    CREATE TABLE IF NOT EXISTS fts_agents_bridge (
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

  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS work_items_fts USING fts5(
      title,
      description,
      content_rowid=rowid
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS agents_fts USING fts5(
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

  // ── Sync triggers ─────────────────────────────────────────────
  // Keep FTS5 tables in sync with source tables on INSERT/UPDATE/DELETE.
  // Triggers are idempotent — SQLite ignores CREATE TRIGGER IF NOT EXISTS
  // (not supported), so we use DROP + CREATE pattern.

  // Work Items triggers
  sqlite.exec(`
    DROP TRIGGER IF EXISTS fts_work_items_insert;
    CREATE TRIGGER fts_work_items_insert AFTER INSERT ON work_items
    BEGIN
      INSERT OR IGNORE INTO fts_work_items_bridge (entity_id) VALUES (NEW.id);
      INSERT INTO work_items_fts (rowid, title, description)
        SELECT b.rowid, NEW.title, COALESCE(NEW.description, '')
        FROM fts_work_items_bridge b WHERE b.entity_id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS fts_work_items_update;
    CREATE TRIGGER fts_work_items_update AFTER UPDATE ON work_items
    BEGIN
      INSERT OR IGNORE INTO fts_work_items_bridge (entity_id) VALUES (NEW.id);
      UPDATE work_items_fts SET title = NEW.title, description = COALESCE(NEW.description, '')
        WHERE rowid = (SELECT b.rowid FROM fts_work_items_bridge b WHERE b.entity_id = NEW.id);
    END;

    DROP TRIGGER IF EXISTS fts_work_items_delete;
    CREATE TRIGGER fts_work_items_delete AFTER DELETE ON work_items
    BEGIN
      DELETE FROM work_items_fts WHERE rowid = (SELECT b.rowid FROM fts_work_items_bridge b WHERE b.entity_id = OLD.id);
      DELETE FROM fts_work_items_bridge WHERE entity_id = OLD.id;
    END;
  `);

  // Agents triggers
  sqlite.exec(`
    DROP TRIGGER IF EXISTS fts_agents_insert;
    CREATE TRIGGER fts_agents_insert AFTER INSERT ON agents
    BEGIN
      INSERT OR IGNORE INTO fts_agents_bridge (entity_id) VALUES (NEW.id);
      INSERT INTO agents_fts (rowid, name, system_prompt)
        SELECT b.rowid, NEW.name, COALESCE(NEW.system_prompt, '')
        FROM fts_agents_bridge b WHERE b.entity_id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS fts_agents_update;
    CREATE TRIGGER fts_agents_update AFTER UPDATE ON agents
    BEGIN
      INSERT OR IGNORE INTO fts_agents_bridge (entity_id) VALUES (NEW.id);
      UPDATE agents_fts SET name = NEW.name, system_prompt = COALESCE(NEW.system_prompt, '')
        WHERE rowid = (SELECT b.rowid FROM fts_agents_bridge b WHERE b.entity_id = NEW.id);
    END;

    DROP TRIGGER IF EXISTS fts_agents_delete;
    CREATE TRIGGER fts_agents_delete AFTER DELETE ON agents
    BEGIN
      DELETE FROM agents_fts WHERE rowid = (SELECT b.rowid FROM fts_agents_bridge b WHERE b.entity_id = OLD.id);
      DELETE FROM fts_agents_bridge WHERE entity_id = OLD.id;
    END;
  `);

  // Comments triggers
  sqlite.exec(`
    DROP TRIGGER IF EXISTS fts_comments_insert;
    CREATE TRIGGER fts_comments_insert AFTER INSERT ON comments
    BEGIN
      INSERT OR IGNORE INTO fts_comments_bridge (entity_id) VALUES (NEW.id);
      INSERT INTO comments_fts (rowid, body)
        SELECT b.rowid, NEW.content
        FROM fts_comments_bridge b WHERE b.entity_id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS fts_comments_update;
    CREATE TRIGGER fts_comments_update AFTER UPDATE ON comments
    BEGIN
      INSERT OR IGNORE INTO fts_comments_bridge (entity_id) VALUES (NEW.id);
      UPDATE comments_fts SET body = NEW.content
        WHERE rowid = (SELECT b.rowid FROM fts_comments_bridge b WHERE b.entity_id = NEW.id);
    END;

    DROP TRIGGER IF EXISTS fts_comments_delete;
    CREATE TRIGGER fts_comments_delete AFTER DELETE ON comments
    BEGIN
      DELETE FROM comments_fts WHERE rowid = (SELECT b.rowid FROM fts_comments_bridge b WHERE b.entity_id = OLD.id);
      DELETE FROM fts_comments_bridge WHERE entity_id = OLD.id;
    END;
  `);

  // Chat Messages triggers
  sqlite.exec(`
    DROP TRIGGER IF EXISTS fts_chat_messages_insert;
    CREATE TRIGGER fts_chat_messages_insert AFTER INSERT ON chat_messages
    BEGIN
      INSERT OR IGNORE INTO fts_chat_messages_bridge (entity_id) VALUES (NEW.id);
      INSERT INTO chat_messages_fts (rowid, content)
        SELECT b.rowid, NEW.content
        FROM fts_chat_messages_bridge b WHERE b.entity_id = NEW.id;
    END;

    DROP TRIGGER IF EXISTS fts_chat_messages_update;
    CREATE TRIGGER fts_chat_messages_update AFTER UPDATE ON chat_messages
    BEGIN
      INSERT OR IGNORE INTO fts_chat_messages_bridge (entity_id) VALUES (NEW.id);
      UPDATE chat_messages_fts SET content = NEW.content
        WHERE rowid = (SELECT b.rowid FROM fts_chat_messages_bridge b WHERE b.entity_id = NEW.id);
    END;

    DROP TRIGGER IF EXISTS fts_chat_messages_delete;
    CREATE TRIGGER fts_chat_messages_delete AFTER DELETE ON chat_messages
    BEGIN
      DELETE FROM chat_messages_fts WHERE rowid = (SELECT b.rowid FROM fts_chat_messages_bridge b WHERE b.entity_id = OLD.id);
      DELETE FROM fts_chat_messages_bridge WHERE entity_id = OLD.id;
    END;
  `);

  // ── Backfill existing data ────────────────────────────────────
  // Only runs if FTS tables are empty (first startup after setup)

  backfillFts5();

  logger.info("FTS5 virtual tables ready");
}

function backfillFts5(): void {
  const bridgeCount = sqlite.prepare("SELECT COUNT(*) as cnt FROM fts_work_items_bridge").get() as { cnt: number };
  if (bridgeCount.cnt > 0) return; // Already populated

  logger.info("Backfilling FTS5 tables from existing data...");

  // Work items
  sqlite.exec(`
    INSERT OR IGNORE INTO fts_work_items_bridge (entity_id)
      SELECT id FROM work_items;
    INSERT INTO work_items_fts (rowid, title, description)
      SELECT b.rowid, wi.title, COALESCE(wi.description, '')
      FROM work_items wi
      JOIN fts_work_items_bridge b ON b.entity_id = wi.id;
  `);

  // Agents
  sqlite.exec(`
    INSERT OR IGNORE INTO fts_agents_bridge (entity_id)
      SELECT id FROM agents;
    INSERT INTO agents_fts (rowid, name, system_prompt)
      SELECT b.rowid, p.name, COALESCE(p.system_prompt, '')
      FROM agents p
      JOIN fts_agents_bridge b ON b.entity_id = p.id;
  `);

  // Comments
  sqlite.exec(`
    INSERT OR IGNORE INTO fts_comments_bridge (entity_id)
      SELECT id FROM comments;
    INSERT INTO comments_fts (rowid, body)
      SELECT b.rowid, c.content
      FROM comments c
      JOIN fts_comments_bridge b ON b.entity_id = c.id;
  `);

  // Chat messages
  sqlite.exec(`
    INSERT OR IGNORE INTO fts_chat_messages_bridge (entity_id)
      SELECT id FROM chat_messages;
    INSERT INTO chat_messages_fts (rowid, content)
      SELECT b.rowid, m.content
      FROM chat_messages m
      JOIN fts_chat_messages_bridge b ON b.entity_id = m.id;
  `);

  const count = sqlite.prepare("SELECT COUNT(*) as cnt FROM fts_work_items_bridge").get() as { cnt: number };
  logger.info({ backfilledWorkItems: count.cnt }, "FTS5 backfill complete");
}
