type Task<T> = () => Promise<T>;
export declare class WriteQueue {
    private queue;
    private isProcessing;
    enqueue<T>(task: Task<T>): Promise<T>;
    private processNext;
}
export {};
//# sourceMappingURL=writeQueue.d.ts.map