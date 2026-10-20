export declare class IdempotencyStore {
    private static store;
    private static TTL_MS;
    static get(key: string): string | null;
    static set(key: string, submissionId: string): void;
    private static cleanExpired;
}
//# sourceMappingURL=idempotency.d.ts.map