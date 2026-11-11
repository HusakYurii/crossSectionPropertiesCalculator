import type { Sizes, Service, Point, BoundingBox } from "../../../../interfaces/common/types";
import type { CanvasTransformState } from "../canvas/Canvas";
import type { InputService } from "./InputService";

const PAN_MOUSE_BUTTON = 2; // right mouse button

type CanvasTransformServiceProps = {
	canvas: HTMLCanvasElement;
	inputService: InputService;
	getDisplaySize: () => Sizes;
	onViewChange: () => void;
	minZoom?: number;
	maxZoom?: number;
	zoomFactor?: number;
};

/**
 * This class is responsible only for calculating the canvas transforms when a user wants to zoom or pan.
 * Zoom: mouse wheel. Pan: right mouse button + drag.
 */
export class CanvasTransformService implements Service {
	private _canvas: HTMLCanvasElement;
	private _inputService: InputService;
	private _getDisplaySize: () => Sizes;
	private _onViewChange: () => void;
	private _minZoom: number;
	private _maxZoom: number;
	private _zoomFactor: number;
	private _currentTransforms: CanvasTransformState = { zoom: 1, panX: 0, panY: 0 };
	private _isPanning = false;
	private _panStart = { x: 0, y: 0, panX: 0, panY: 0 };
	private _unsubscribeHandlers: Array<() => void> = [];
	private _active = false;

	constructor(props: CanvasTransformServiceProps) {
		this._canvas = props.canvas;
		this._inputService = props.inputService;
		this._getDisplaySize = props.getDisplaySize;
		this._onViewChange = props.onViewChange;
		this._minZoom = props.minZoom ?? 0.1;
		this._maxZoom = props.maxZoom ?? 10;
		this._zoomFactor = props.zoomFactor ?? 1.02;
	}

	get transforms(): CanvasTransformState {
		return this._currentTransforms;
	}

	get isPanModeActive(): boolean {
		return this._isPanning;
	}

	screenToWorld(point: Point): Point {
		const { width, height } = this._getDisplaySize();
		const sx = point.x - width / 2;
		const sy = point.y - height / 2;

		return {
			x: (sx - this._currentTransforms.panX) / this._currentTransforms.zoom,
			y: (this._currentTransforms.panY - sy) / this._currentTransforms.zoom,
		};
	}

	/** The inverse of `screenToWorld`: where a world point lands on the canvas, in screen pixels. */
	worldToScreen(point: Point): Point {
		const { width, height } = this._getDisplaySize();

		return {
			x: point.x * this._currentTransforms.zoom + this._currentTransforms.panX + width / 2,
			y: this._currentTransforms.panY - point.y * this._currentTransforms.zoom + height / 2,
		};
	}

	/** Centers a world-space box in the canvas and zooms so it fits, leaving `margin` screen pixels around it. */
	fitToBounds(bounds: BoundingBox, margin: number): void {
		const zoom = this._clamp(this._getFitZoom(bounds, margin), this._minZoom, this._maxZoom);

		this._currentTransforms.zoom = zoom;
		// pan is the screen offset of the world origin from the canvas center, and world y points up
		this._currentTransforms.panX = -(bounds.x + bounds.width / 2) * zoom;
		this._currentTransforms.panY = (bounds.y + bounds.height / 2) * zoom;
		this._onViewChange();
	}

	/** Whether `fitToBounds` can show the whole box without the zoom being clamped up to the minimum. */
	canFit(bounds: BoundingBox, margin: number): boolean {
		return this._getFitZoom(bounds, margin) >= this._minZoom;
	}

	/** The zoom at which a box fits the canvas with `margin` screen pixels around it, before clamping. */
	private _getFitZoom(bounds: BoundingBox, margin: number): number {
		const { width, height } = this._getDisplaySize();
		return Math.min((width - margin * 2) / bounds.width, (height - margin * 2) / bounds.height);
	}

	initialize(): void {
		if (this._active) {
			return;
		}

		this._unsubscribeHandlers = [
			this._inputService.onWheel(this._onWheel),
			this._inputService.onMouseDown(this._onMouseDown),
			this._inputService.onMouseMove(this._onMouseMove),
			this._inputService.onMouseUp(this._onMouseUp),
			this._inputService.onMouseLeave(this._onMouseLeave),
			this._inputService.onContextMenu(this._onContextMenu),
			this._inputService.onWindowBlur(this._onWindowBlur),
		];
		this._active = true;
	}

	deactivate(): void {
		if (!this._active) {
			return;
		}

		for (const unsubscribe of this._unsubscribeHandlers) {
			unsubscribe();
		}
		this._unsubscribeHandlers = [];
		this._stopPanning();
		this._canvas.style.cursor = '';
		this._active = false;
	}

	private _clamp(value: number, min: number, max: number): number {
		return Math.min(max, Math.max(min, value));
	}

	private _onWheel = (event: WheelEvent): void => {
		event.preventDefault();

		const factor = event.deltaY > 0 ? 1 / this._zoomFactor : this._zoomFactor;
		const newZoom = this._clamp(this._currentTransforms.zoom * factor, this._minZoom, this._maxZoom);
		if (newZoom === this._currentTransforms.zoom) {
			return;
		}



		const { width, height } = this._getDisplaySize();
		const sx = event.offsetX - width / 2;
		const sy = event.offsetY - height / 2;
		const wx = (sx - this._currentTransforms.panX) / this._currentTransforms.zoom;
		const wy = (this._currentTransforms.panY - sy) / this._currentTransforms.zoom;

		this._canvas.style.cursor = event.deltaY > 0 ? 'zoom-out' : 'zoom-in';

		this._currentTransforms.zoom = newZoom;
		this._currentTransforms.panX = sx - wx * newZoom;
		this._currentTransforms.panY = sy + wy * newZoom;
		this._onViewChange();
	};

	private _onMouseDown = (event: MouseEvent): void => {
		if (event.button !== PAN_MOUSE_BUTTON) {
			return;
		}

		event.preventDefault();
		this._isPanning = true;
		this._panStart = {
			x: event.clientX,
			y: event.clientY,
			panX: this._currentTransforms.panX,
			panY: this._currentTransforms.panY,
		};
		this._updateCursor();
	};

	private _onMouseMove = (event: MouseEvent): void => {
		if (!this._isPanning) {
			this._canvas.style.cursor = '';
			return;
		}

		this._currentTransforms.panX = this._panStart.panX + (event.clientX - this._panStart.x);
		this._currentTransforms.panY = this._panStart.panY + (event.clientY - this._panStart.y);
		this._updateCursor();
		this._onViewChange();
	};

	private _onMouseUp = (event: MouseEvent): void => {
		if (event.button === PAN_MOUSE_BUTTON) {
			this._stopPanning();
			this._updateCursor();
		}
	};

	private _onMouseLeave = (): void => {
		this._stopPanning();
		this._updateCursor();
	};

	private _onContextMenu = (event: MouseEvent): void => {
		event.preventDefault();
	};

	private _onWindowBlur = (): void => {
		this._stopPanning();
		this._canvas.style.cursor = '';
	};

	private _stopPanning(): void {
		this._isPanning = false;
	}

	private _updateCursor(): void {
		this._canvas.style.cursor = this._isPanning ? 'grabbing' : '';
	}
}
