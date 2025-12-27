// This entry only stores the metadata and path reference
export interface CacheEntry {
  url: string; // (PRIMARY KEY)
  local_path: string; // Path to cached file in FileSystem
  size_bytes: number; // File size in bytes (for LRU eviction calculations)

  /**
   * last_accessed_at - For LRU (Least Recently Used) eviction
   * - Updates EVERY time the image is accessed
   * - When cache hits 100MB limit, we delete entries with oldest last_accessed_at
   * - Indexed for fast sorting/querying
   */
  last_accessed_at: number; // Unix timestamp in ms

  /**
   * expires_at - For TTL (Time To Live) expiration
   * - Set ONCE when cached: Date.now() + 7_DAYS_IN_MS
   * - Never changes after initial set
   * - Used to delete stale/expired images
   * - Indexed for fast filtering (WHERE expires_at < NOW)
   */
  expires_at: number; // Unix timestamp in ms

  created_at: number; // Unix timestamp in ms (when first cached)
}

/// Statistics about the current cache state
export interface CacheStats {
  totalSize: number; // Total bytes used in cache
  entryCount: number; // Number of cached images
  oldestEntry: number | null; // Oldest last_accessed_at timestamp
  newestEntry: number | null; // Newest last_accessed_at timestamp
}

// Result when getting an image from cache
export interface CacheResult {
  localPath: string; // Path to the cached file
  fromCache: boolean; // true = cache hit, false = just downloaded
}
