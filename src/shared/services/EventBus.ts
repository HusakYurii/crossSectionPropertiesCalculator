type Handler<P> = (...payload: P extends void ? [] : [P]) => void;

export type AppEvents = {
	projectLoaded: void;
};

class EventBus<E extends Record<string, unknown>> {
	private _handlers = new Map<keyof E, Set<Handler<any>>>();

	on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
		let set = this._handlers.get(event);
		if (!set) {
			set = new Set();
			this._handlers.set(event, set);
		}
		set.add(handler);
		return () => this.off(event, handler);
	}

	off<K extends keyof E>(event: K, handler: Handler<E[K]>): void {
		this._handlers.get(event)?.delete(handler);
	}

	emit<K extends keyof E>(event: K, ...payload: E[K] extends void ? [] : [E[K]]): void {
		// copy, so a handler that unsubscribes itself does not skip the next one
		for (const handler of [...(this._handlers.get(event) ?? [])]) {
			handler(...payload);
		}
	}
}

/** app-wide events between components that do not know each other */
export const eventBus = new EventBus<AppEvents>();
