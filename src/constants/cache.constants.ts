// Maximum cache size in bytes (100MB) When this limit is exceeded, LRU eviction kicks in
export const MAX_CACHE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

// Time-to-live for cached images (7 days in milliseconds)
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// SQLite database name
export const DB_NAME = "jstash.db";

// Table name for cached images
export const CACHE_TABLE = "image_cache";

// Directory name for storing cached images
export const CACHE_DIR_NAME = "images";
