import { open } from "@op-engineering/op-sqlite";
import type { DB } from "@op-engineering/op-sqlite";
import { CacheEntry, CacheStats } from "../types";
import { DB_NAME, CACHE_TABLE } from "../constants/cache.constants";

class DatabaseService {
  private db: DB | null = null;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.db = open({ name: DB_NAME });

      // Enable WAL mode for concurrent access
      await this.db.execute("PRAGMA journal_mode = WAL");
      // Enable foreign key constraints for future relations
      await this.db.execute("PRAGMA foreign_keys = ON");

      // Create cache table
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS ${CACHE_TABLE} (
          url TEXT PRIMARY KEY NOT NULL,
          local_path TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          last_accessed_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);

      // Create indexes for LRU and TTL queries
      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_last_accessed
        ON ${CACHE_TABLE}(last_accessed_at)
      `);

      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_expires
        ON ${CACHE_TABLE}(expires_at)
      `);
    })();

    return this.initPromise;
  }

  private async getDB(): Promise<DB> {
    if (!this.db) await this.initialize();
    return this.db!;
  }

  async upsertCacheEntry(entry: CacheEntry): Promise<void> {
    const db = await this.getDB();
    await db.execute(
      `INSERT OR REPLACE INTO ${CACHE_TABLE}
       (url, local_path, size_bytes, last_accessed_at, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry.url,
        entry.local_path,
        entry.size_bytes,
        entry.last_accessed_at,
        entry.expires_at,
        entry.created_at,
      ]
    );
  }

  async getCacheEntry(url: string): Promise<CacheEntry | null> {
    const db = await this.getDB();
    const result = await db.execute(
      `SELECT * FROM ${CACHE_TABLE} WHERE url = ?`,
      [url]
    );
    return result.rows && result.rows.length > 0
      ? (result.rows[0] as unknown as CacheEntry)
      : null;
  }

  async updateLastAccessed(url: string): Promise<void> {
    const db = await this.getDB();
    await db.execute(
      `UPDATE ${CACHE_TABLE} SET last_accessed_at = ? WHERE url = ?`,
      [Date.now(), url]
    );
  }

  async getTotalCacheSize(): Promise<number> {
    const db = await this.getDB();
    const result = await db.execute(
      `SELECT SUM(size_bytes) as total FROM ${CACHE_TABLE}`
    );
    const total = result.rows?.[0]?.total;
    return typeof total === "number" ? total : 0;
  }

  async getCacheStats(): Promise<CacheStats> {
    const db = await this.getDB();
    const result = await db.execute(`
      SELECT
        SUM(size_bytes) as totalSize,
        COUNT(*) as entryCount,
        MIN(last_accessed_at) as oldestEntry,
        MAX(last_accessed_at) as newestEntry
      FROM ${CACHE_TABLE}
    `);

    const row = result.rows?.[0];
    return {
      totalSize: typeof row?.totalSize === "number" ? row.totalSize : 0,
      entryCount: typeof row?.entryCount === "number" ? row.entryCount : 0,
      oldestEntry:
        typeof row?.oldestEntry === "number" ? row.oldestEntry : null,
      newestEntry:
        typeof row?.newestEntry === "number" ? row.newestEntry : null,
    };
  }

  async deleteExpiredEntries(): Promise<number> {
    const db = await this.getDB();
    const result = await db.execute(
      `DELETE FROM ${CACHE_TABLE} WHERE expires_at < ?`,
      [Date.now()]
    );
    return result.rowsAffected || 0;
  }

  async getLRUEntries(limit: number): Promise<CacheEntry[]> {
    const db = await this.getDB();
    const result = await db.execute(
      `SELECT * FROM ${CACHE_TABLE} ORDER BY last_accessed_at ASC LIMIT ?`,
      [limit]
    );
    return (result.rows as unknown as CacheEntry[]) || [];
  }

  async deleteCacheEntry(url: string): Promise<void> {
    const db = await this.getDB();
    await db.execute(`DELETE FROM ${CACHE_TABLE} WHERE url = ?`, [url]);
  }

  async clearAllEntries(): Promise<void> {
    const db = await this.getDB();
    await db.execute(`DELETE FROM ${CACHE_TABLE}`);
  }
}

export const databaseService = new DatabaseService();
