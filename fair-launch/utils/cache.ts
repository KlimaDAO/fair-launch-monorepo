class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  get(key: string) {
    const cachedEntry = this.cache.get(key);
    if (cachedEntry) {
      const { data } = cachedEntry;
      return { data }; // Return cached data if still valid
    }
    return null; // Cache is expired or doesn't exist
  }

  update(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() }); // Update in-memory cache with timestamp
  }
}

export const cacheManager = new CacheManager();