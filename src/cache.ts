interface CacheEntry {
  token: string;
  expiresAt: number; // timestamp in milliseconds
}

export class TokenCache {
  private cache: Map<string, CacheEntry>;
  private cleanupInterval: NodeJS.Timeout | null;
  private readonly ttl: number; // Time to live in milliseconds
  private readonly cleanupIntervalMs: number; // Cleanup interval in milliseconds

  constructor(ttlMinutes: number = 1, cleanupIntervalSeconds: number = 30) {
    this.cache = new Map();
    this.cleanupInterval = null;
    this.ttl = ttlMinutes * 60 * 1000; // Convert minutes to milliseconds
    this.cleanupIntervalMs = cleanupIntervalSeconds * 1000; // Convert seconds to milliseconds
  }

  /**
   * Get a cached token by key.
   * Returns null if the key doesn't exist or the entry has expired.
   *
   * @param key - The cache key (accessToken.key)
   * @returns The cached token string or null if not found/expired
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.expiresAt < Date.now()) {
      // Remove expired entry
      this.cache.delete(key);
      return null;
    }

    return entry.token;
  }

  /**
   * Store a token in the cache with TTL.
   *
   * @param key - The cache key (accessToken.key)
   * @param token - The token string to cache
   */
  set(key: string, token: string): void {
    const expiresAt = Date.now() + this.ttl;
    this.cache.set(key, { token, expiresAt });
  }

  /**
   * Start the cleanup interval task.
   * This will periodically check all entries and remove expired ones.
   */
  startCleanup(): void {
    if (this.cleanupInterval) {
      // Already started
      return;
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  /**
   * Stop the cleanup interval task.
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Cleanup expired entries by checking all entries in the cache.
   * This is called by the interval task.
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    // Collect all expired keys
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        keysToDelete.push(key);
      }
    }

    // Remove expired entries
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }

  /**
   * Clear all entries from the cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get the current size of the cache.
   */
  size(): number {
    return this.cache.size;
  }
}

