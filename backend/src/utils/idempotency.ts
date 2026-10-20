interface CacheItem {
  submissionId: string;
  timestamp: number;
}

export class IdempotencyStore {
  private static store = new Map<string, CacheItem>();
  private static TTL_MS = 60 * 60 * 1000; // 1 hour

  public static get(key: string): string | null {
    this.cleanExpired();
    const item = this.store.get(key);
    return item ? item.submissionId : null;
  }

  public static set(key: string, submissionId: string): void {
    this.store.set(key, {
      submissionId,
      timestamp: Date.now()
    });
  }

  private static cleanExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now - item.timestamp > this.TTL_MS) {
        this.store.delete(key);
      }
    }
  }
}
