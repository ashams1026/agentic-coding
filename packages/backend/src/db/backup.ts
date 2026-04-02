/**
 * Database Backup — uses SQLite backup() API for safe WAL-mode backups.
 *
 * Backup storage: ~/.agentops/backups/ with timestamped filenames.
 * Retention: 7 daily + 4 weekly, older backups are deleted.
 */

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { sqlite, DB_PATH } from "./connection.js";
import { logger } from "../logger.js";

// ── Constants ───────────────────────────────────────────────────

const BACKUP_DIR = join(homedir(), ".agentops", "backups");
const MAX_DAILY = 7;
const MAX_WEEKLY = 4;

// ── Ensure backup directory exists ──────────────────────────────

function ensureBackupDir(): void {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// ── Create backup ───────────────────────────────────────────────

/**
 * Create a backup of the database using SQLite backup() API.
 * Safe for WAL-mode databases (unlike file copy).
 *
 * @returns The path to the backup file
 */
export function createBackup(): string {
  ensureBackupDir();

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `woof-backup-${timestamp}.db`;
  const backupPath = join(BACKUP_DIR, filename);

  try {
    sqlite.backup(backupPath);
    logger.info({ backupPath, filename }, "Database backup created");

    // Run retention cleanup after successful backup
    cleanupOldBackups();

    return backupPath;
  } catch (err) {
    logger.error({ err, backupPath }, "Database backup failed");
    throw err;
  }
}

// ── List backups ────────────────────────────────────────────────

export interface BackupInfo {
  filename: string;
  path: string;
  sizeBytes: number;
  createdAt: string;
}

export function listBackups(): BackupInfo[] {
  ensureBackupDir();

  const files = readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith("woof-backup-") && f.endsWith(".db"))
    .sort()
    .reverse(); // newest first

  return files.map((f) => {
    const fullPath = join(BACKUP_DIR, f);
    const stat = statSync(fullPath);
    return {
      filename: f,
      path: fullPath,
      sizeBytes: stat.size,
      createdAt: stat.mtime.toISOString(),
    };
  });
}

// ── Restore backup ──────────────────────────────────────────────

/**
 * Restore a backup by copying the backup file over the current database.
 * WARNING: This requires the server to be stopped. The caller is
 * responsible for stopping the server before calling this.
 *
 * @param backupPath Path to the backup file to restore
 */
export function restoreBackup(backupPath: string): void {
  if (!existsSync(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  // Create a safety backup of the current DB before overwriting
  const safetyPath = join(BACKUP_DIR, `pre-restore-${Date.now()}.db`);
  try {
    sqlite.backup(safetyPath);
    logger.info({ safetyPath }, "Pre-restore safety backup created");
  } catch {
    logger.warn("Could not create pre-restore safety backup");
  }

  // Copy backup over current database
  copyFileSync(backupPath, DB_PATH);
  logger.info({ backupPath, dbPath: DB_PATH }, "Database restored from backup");
}

// ── Retention cleanup ───────────────────────────────────────────

function cleanupOldBackups(): void {
  const backups = listBackups();
  if (backups.length <= MAX_DAILY) return; // Nothing to clean

  const now = new Date();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;

  // Categorize backups
  const daily: BackupInfo[] = [];
  const weekly: BackupInfo[] = [];
  const older: BackupInfo[] = [];

  for (const backup of backups) {
    const age = now.getTime() - new Date(backup.createdAt).getTime();
    if (age < MAX_DAILY * oneDayMs) {
      daily.push(backup);
    } else if (age < MAX_WEEKLY * oneWeekMs) {
      weekly.push(backup);
    } else {
      older.push(backup);
    }
  }

  // Keep MAX_DAILY daily backups (newest)
  const dailyToDelete = daily.slice(MAX_DAILY);
  // Keep MAX_WEEKLY weekly backups (one per week, newest in each week)
  const weeklyToDelete = weekly.slice(MAX_WEEKLY);
  // Delete all older backups
  const toDelete = [...dailyToDelete, ...weeklyToDelete, ...older];

  for (const backup of toDelete) {
    try {
      unlinkSync(backup.path);
      logger.debug({ filename: backup.filename }, "Old backup deleted");
    } catch (err) {
      logger.warn({ err, filename: backup.filename }, "Failed to delete old backup");
    }
  }

  if (toDelete.length > 0) {
    logger.info({ deleted: toDelete.length, remaining: backups.length - toDelete.length }, "Backup retention cleanup");
  }
}
