import * as FileSystem from "expo-file-system";
import { databaseService } from "./database.service";
import { storage } from "@utils/storage";
import { CacheEntry, CacheResult } from "../types";
import {
  MAX_CACHE_SIZE_BYTES,
  CACHE_TTL_MS,
  CACHE_DIR_NAME,
} from "@constants/cache.constants";

class ImageCacheService {
  private cacheDir: FileSystem.Directory;
  private operationLocks: Map<string, Promise<string>> = new Map();

  constructor() {
    this.cacheDir = new FileSystem.Directory(
      FileSystem.Paths.cache,
      CACHE_DIR_NAME
    );
  }

  async initialize(): Promise<void> {
    await databaseService.initialize();

    // Create cache directory
    if (!this.cacheDir.exists) {
      this.cacheDir.create({ intermediates: true });
    }

    // Clean up expired entries on init
    await this.cleanupExpiredEntries();
  }

  async getImage(url: string): Promise<CacheResult> {
    // Tier 1: Check storage hot cache
    const cachedPath = storage.getString(url);
    if (cachedPath) {
      const file = new FileSystem.File(cachedPath);
      if (file.exists) {
        databaseService.updateLastAccessed(url).catch(console.error);
        return { localPath: cachedPath, fromCache: true };
      }
    }

    // Tier 2: Check SQLite metadata
    const entry = await databaseService.getCacheEntry(url);
    if (entry && entry.expires_at > Date.now()) {
      const file = new FileSystem.File(entry.local_path);
      if (file.exists) {
        storage.set(url, entry.local_path);
        await databaseService.updateLastAccessed(url);
        return { localPath: entry.local_path, fromCache: true };
      }
    }

    // Tier 3: Download and cache
    const localPath = await this.downloadAndCache(url);
    return { localPath, fromCache: false };
  }

  private async downloadAndCache(url: string): Promise<string> {
    // Check if download already in progress (operation lock)
    const existingOp = this.operationLocks.get(url);
    if (existingOp) {
      return existingOp;
    }

    const downloadPromise = this._performDownload(url);
    this.operationLocks.set(url, downloadPromise);

    try {
      const localPath = await downloadPromise;
      return localPath;
    } finally {
      this.operationLocks.delete(url);
    }
  }

  private async _performDownload(url: string): Promise<string> {
    const fileName = this.generateFileName(url);
    const finalFile = this.cacheDir.createFile(fileName, null);
    const tempFileName = `${fileName}.tmp`;
    const tempFile = this.cacheDir.createFile(tempFileName, null);

    try {
      // Download to temporary file using new API
      await FileSystem.File.downloadFileAsync(url, tempFile, {
        idempotent: true,
      });

      // Delete final file if it exists before moving
      if (finalFile.exists) {
        finalFile.delete();
      }

      // Atomic rename: Move .tmp to final file
      tempFile.move(finalFile);

      // Get file size for LRU calculations
      const sizeBytes = finalFile.size;

      // Check if cache size limit exceeded, evict if needed
      await this.evictIfNeeded(sizeBytes);

      // Save metadata to SQLite
      const now = Date.now();
      const entry: CacheEntry = {
        url,
        local_path: finalFile.uri,
        size_bytes: sizeBytes,
        last_accessed_at: now,
        expires_at: now + CACHE_TTL_MS,
        created_at: now,
      };
      await databaseService.upsertCacheEntry(entry);

      // Save to storage hot cache
      storage.set(url, finalFile.uri);

      return finalFile.uri;
    } catch (error) {
      // Cleanup temp file on error
      if (tempFile.exists) {
        tempFile.delete();
      }
      throw error;
    }
  }

  private async evictIfNeeded(newFileSizeBytes: number): Promise<void> {
    const currentSize = await databaseService.getTotalCacheSize();
    const projectedSize = currentSize + newFileSizeBytes;

    if (projectedSize <= MAX_CACHE_SIZE_BYTES) {
      return;
    }

    const sizeToFree = projectedSize - MAX_CACHE_SIZE_BYTES;
    let freedSize = 0;

    const lruEntries = await databaseService.getLRUEntries(50);

    for (const entry of lruEntries) {
      if (freedSize >= sizeToFree) break;

      try {
        const file = new FileSystem.File(entry.local_path);
        if (file.exists) {
          file.delete();
        }

        await databaseService.deleteCacheEntry(entry.url);
        storage.remove(entry.url);

        freedSize += entry.size_bytes;
      } catch (error) {
        console.error(`Failed to evict ${entry.url}:`, error);
      }
    }
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const deletedCount = await databaseService.deleteExpiredEntries();
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} expired cache entries`);
    }
  }

  private generateFileName(url: string): string {
    const hash = this.simpleHash(url);
    const ext = url.split(".").pop()?.split("?")[0] || "jpg";
    return `${hash}.${ext}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  async getCacheStats() {
    return databaseService.getCacheStats();
  }

  async clearCache(): Promise<void> {
    storage.clearAll();
    await databaseService.clearAllEntries();

    if (this.cacheDir.exists) {
      this.cacheDir.delete();
    }
    this.cacheDir.create({ intermediates: true });
  }
}

export const imageCacheService = new ImageCacheService();
