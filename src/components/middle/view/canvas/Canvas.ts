export type CanvasSize = {
	displayWidth: number;
	displayHeight: number;
	pixelWidth: number;
	pixelHeight: number;
	dpr: number;
};

export type CanvasTransformState = {
	zoom: number;
	panX: number;
	panY: number;
};

const DEFAULT_CANVAS_STATE: CanvasTransformState = {
	zoom: 1,
	panX: 0,
	panY: 0
}

export class Canvas {
	private _canvas: HTMLCanvasElement;
	private _ctx: CanvasRenderingContext2D;
	private _size: CanvasSize = {
		displayWidth: 0,
		displayHeight: 0,
		pixelWidth: 0,
		pixelHeight: 0,
		dpr: 1,
	};

	constructor(canvas: HTMLCanvasElement) {
		this._canvas = canvas;
		this._ctx = canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D;
	}

	get context(): CanvasRenderingContext2D {
		return this._ctx;
	}

	get canvasSize(): CanvasSize {
		return this._size;
	}

	resize(size: CanvasSize): void {
		this._size = size;

		this._canvas.style.width = `${size.displayWidth}px`;
		this._canvas.style.height = `${size.displayHeight}px`;
		this._canvas.width = size.pixelWidth;
		this._canvas.height = size.pixelHeight;
	}

	clearAndApplyTransforms(view: CanvasTransformState = DEFAULT_CANVAS_STATE): void {
		if (!this._ctx) {
			return;
		}

		const { displayWidth, displayHeight, dpr } = this._size;

		this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		this._ctx.clearRect(0, 0, displayWidth, displayHeight);
		this._ctx.translate(displayWidth / 2 + view.panX, displayHeight / 2 + view.panY);
		this._ctx.scale(view.zoom, -view.zoom);
	}
}
