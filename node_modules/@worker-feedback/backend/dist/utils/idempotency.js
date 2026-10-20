"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdempotencyStore = void 0;
class IdempotencyStore {
    static store = new Map();
    static TTL_MS = 60 * 60 * 1000; // 1 hour
    static get(key) {
        this.cleanExpired();
        const item = this.store.get(key);
        return item ? item.submissionId : null;
    }
    static set(key, submissionId) {
        this.store.set(key, {
            submissionId,
            timestamp: Date.now()
        });
    }
    static cleanExpired() {
        const now = Date.now();
        for (const [key, item] of this.store.entries()) {
            if (now - item.timestamp > this.TTL_MS) {
                this.store.delete(key);
            }
        }
    }
}
exports.IdempotencyStore = IdempotencyStore;
//# sourceMappingURL=idempotency.js.map