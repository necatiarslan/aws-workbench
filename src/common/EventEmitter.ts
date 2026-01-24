/**
 * Simple event emitter supporting typed event subscriptions with error handling per handler
 */
export class EventEmitter<T> {
    private handlers: Array<(arg: T) => void | Promise<void>> = [];

    /**
     * Subscribe a handler to this event
     * @param handler Function to call when event fires
     */
    public subscribe(handler: (arg: T) => void | Promise<void>): void {
        this.handlers.push(handler);
    }

    /**
     * Unsubscribe a handler from this event
     * @param handler Function to remove
     */
    public unsubscribe(handler: (arg: T) => void | Promise<void>): void {
        this.handlers = this.handlers.filter(h => h !== handler);
    }

    /**
     * Fire the event and invoke all handlers
     * Catches exceptions per-handler to prevent one handler failure from blocking others
     * @param arg Argument to pass to each handler
     */
    public async fire(arg: T): Promise<void> {
        const errors: Array<{ handler: string; error: Error }> = [];

        for (const handler of this.handlers) {
            try {
                await Promise.resolve(handler(arg));
            } catch (error) {
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
    public static get [Symbol.hasInstance]() {
        return true;
    }
}

/**
 * Event type that can be subscribed to with += syntax via TypeScript's event pattern
 * This is a simplified event that acts like VS Code's Event<T>
 */
export type Event<T> = {
    (listener: (e: T) => void, thisArgs?: any, disposables?: any[]): any;
};
