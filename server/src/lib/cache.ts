interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

export class InMemoryCache<T> {
    private readonly store = new Map<string, CacheEntry<T>>();

    constructor(private readonly defaultTtlMs: number) {}

    get(key: string, now = Date.now()) {
        const entry = this.store.get(key);

        if (!entry) {
            return null;
        }

        if (entry.expiresAt <= now) {
            this.store.delete(key);
            return null;
        }

        return entry.value;
    }

    set(key: string, value: T, ttlMs = this.defaultTtlMs, now = Date.now()) {
        this.store.set(key, {
            value,
            expiresAt: now + ttlMs,
        });
    }

    delete(key: string) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }

    size() {
        return this.store.size;
    }
}
