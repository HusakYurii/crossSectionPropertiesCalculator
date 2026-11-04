type DrawTargetsCollectionProps = {
	context: CanvasRenderingContext2D
}

export interface DrawableTarget {
	uid: string;
	draw: (props: DrawTargetsCollectionProps) => void;
}


/**
 * Generic registry of canvas-drawn items: add/delete by uid, draw them all
 * against a given context. Subclasses override draw() when an item needs
 * more than just {context} (see BeamsDrawTargetCollectionCollections).
 */
export class DrawTargetsCollection<T extends DrawableTarget> {
	protected _items: T[] = [];

	protected _props: DrawTargetsCollectionProps;

	constructor(props: DrawTargetsCollectionProps) {
		this._props = props;
	}

	cleanUp() {
		this._items = [];
	}

	add(...items: T[]): void {
		this._items.push(...items);
	}

	delete(uid: string): void {
		this._items = this._items.filter(item => item.uid !== uid);
	}

	/** 
	 * 
	 * This is needed only because we added the history feature but the DrawTargetsCollection never
	 * remove and recreate DrawableTarget for performance, so we have to check uids from history to 
	 * put them in right order
	 * 
	 * Note: items that are not listed go to the end, in their old order
	 *  */
	sortBy(uids: string[]): void {
		const rank = new Map(uids.map((uid, i) => [uid, i]));

		this._items = [...this._items].sort((a, b) => {
			const ra = rank.get(a.uid) ?? Number.MAX_SAFE_INTEGER;
			const rb = rank.get(b.uid) ?? Number.MAX_SAFE_INTEGER;
			return ra - rb;
		});
	}

	getTargets(): ReadonlyArray<T> {
		return this._items;
	}

	draw(..._args: any[]): void {
		this._items.forEach(item => item.draw(this._props));
	}
}
