"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteQueue = void 0;
class WriteQueue {
    queue = [];
    isProcessing = false;
    enqueue(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({ task, resolve, reject });
            this.processNext();
        });
    }
    async processNext() {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }
        this.isProcessing = true;
        const item = this.queue.shift();
        if (item) {
            try {
                const result = await item.task();
                item.resolve(result);
            }
            catch (error) {
                item.reject(error);
            }
            finally {
                this.isProcessing = false;
                this.processNext();
            }
        }
    }
}
exports.WriteQueue = WriteQueue;
//# sourceMappingURL=writeQueue.js.map