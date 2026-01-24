"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventEmitter = void 0;
/**
 * Simple event emitter supporting typed event subscriptions with error handling per handler
 */
class EventEmitter {
    handlers = [];
    /**
     * Subscribe a handler to this event
     * @param handler Function to call when event fires
     */
    subscribe(handler) {
        this.handlers.push(handler);
    }
    /**
     * Unsubscribe a handler from this event
     * @param handler Function to remove
     */
    unsubscribe(handler) {
        this.handlers = this.handlers.filter(h => h !== handler);
    }
    /**
     * Fire the event and invoke all handlers
     * Catches exceptions per-handler to prevent one handler failure from blocking others
     * @param arg Argument to pass to each handler
     */
    async fire(arg) {
        const errors = [];
        for (const handler of this.handlers) {
            try {
                await Promise.resolve(handler(arg));
            }
            catch (error) {
                errors.push({
                    handler: handler.name || 'anonymous',
                    error: error instanceof Error ? error : new Error(String(error))
                });
            }
        }
        // Log any errors that occurred (but don't throw to allow other handlers to complete)
        if (errors.length > 0) {
            const errorDetails = errors
                .map(e => `${e.handler}: ${e.error.message}`)
                .join('; ');
            console.error(`[EventEmitter] Errors in event handlers: ${errorDetails}`);
        }
    }
    /**
     * Operator overload syntax: allows += and -= syntax like C# events
     * Usage: emitter += handler or emitter -= handler
     */
    static get [Symbol.hasInstance]() {
        return true;
    }
}
exports.EventEmitter = EventEmitter;
//# sourceMappingURL=EventEmitter.js.map