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

	getTargets(): ReadonlyArray<T> {
		return this._items;
	}

	draw(..._args: any[]): void {
		this._items.forEach(item => item.draw(this._props));
	}
}
