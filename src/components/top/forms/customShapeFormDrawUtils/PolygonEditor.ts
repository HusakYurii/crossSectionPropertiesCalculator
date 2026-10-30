import type { Point, Service } from "../../../../interfaces/common/types";
import type { CanvasTransformService } from "../../../middle/view/services/CanvasTransformService";
import type { InputService } from "../../../middle/view/services/InputService";
import { CURSOR } from "../../../middle/view/canvas/constants/cursors";
import { getSnapStep, snapPoint } from "../../../middle/view/canvas/gridSnap";

// how close (screen px) the cursor has to be to a point to grab it
const HIT_RADIUS = 10;
// a press that moves less than this (screen px) is a click, not a drag
const CLICK_TOLERANCE = 4;
const LEFT_BUTTON = 0;

type PolygonEditorProps = {
	canvas: HTMLCanvasElement;
	inputService: InputService;
	transformService: CanvasTransformService;
	/** the points being edited; the editor mutates this array in place */
	getPoints: () => Point[];
	getSelectedIndex: () => number | null;
	setSelectedIndex: (index: number | null) => void;
	onChange: () => void;
};

/**
 * Click on empty canvas to add a point, drag a point to move it. Pan / zoom is left to
 * CanvasTransformService (right button + wheel). Hold Shift to snap to the grid.
 */
export class PolygonEditor implements Service {
	private _canvas: HTMLCanvasElement;
	private _inputService: InputService;
	private _transformService: CanvasTransformService;
	private _getPoints: () => Point[];
	private _getSelectedIndex: () => number | null;
	private _setSelectedIndex: (index: number | null) => void;
	private _onChange: () => void;

	private _unsubscribeHandlers: Array<() => void> = [];
	private _active = false;

	private _dragIndex: number | null = null;
	private _pressScreen: Point | null = null;
	private _moved = false;

	constructor(props: PolygonEditorProps) {
		this._canvas = props.canvas;
		this._inputService = props.inputService;
		this._transformService = props.transformService;
		this._getPoints = props.getPoints;
		this._getSelectedIndex = props.getSelectedIndex;
		this._setSelectedIndex = props.setSelectedIndex;
		this._onChange = props.onChange;
	}

	initialize(): void {
		if (this._active) {
			return;
		}

		this._unsubscribeHandlers = [
			this._inputService.onMouseDown(this._onMouseDown),
			this._inputService.onMouseMove(this._onMouseMove),
			this._inputService.onMouseUp(this._onMouseUp),
			this._inputService.onMouseLeave(this._onMouseLeave),
		];
		// capture phase on purpose: the modal stops keydown from bubbling up to the window,
		// which is where InputService listens
		window.addEventListener('keydown', this._onKeyDown, true);
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
		window.removeEventListener('keydown', this._onKeyDown, true);
		this._reset();
		this._active = false;
	}

	/** index of the topmost point under the cursor, or -1 */
	private _findPointAt(screen: Point): number {
		const points = this._getPoints();
		for (let i = points.length - 1; i >= 0; i--) {
			const s = this._worldToScreen(points[i]);
			if (Math.hypot(s.x - screen.x, s.y - screen.y) <= HIT_RADIUS) {
				return i;
			}
		}
		return -1;
	}

	private _worldToScreen(world: Point): Point {
		// inverse of CanvasTransformService.screenToWorld
		const { zoom, panX, panY } = this._transformService.transforms;
		const rect = this._canvas.getBoundingClientRect();
		return {
			x: rect.width / 2 + panX + world.x * zoom,
			y: rect.height / 2 + panY - world.y * zoom,
		};
	}

	private _toWorld(event: MouseEvent): Point {
		return this._transformService.screenToWorld({ x: event.offsetX, y: event.offsetY });
	}

	/** points always sit on whole numbers; Shift snaps to the grid instead */
	private _snap(point: Point, event: MouseEvent): Point {
		return snapPoint(point, getSnapStep(event));
	}

	private _onMouseDown = (event: MouseEvent): void => {
		if (event.button !== LEFT_BUTTON) {
			return;
		}

		const screen = { x: event.offsetX, y: event.offsetY };
		this._pressScreen = screen;
		this._moved = false;

		const hit = this._findPointAt(screen);
		if (hit >= 0) {
			this._dragIndex = hit;
			this._setSelectedIndex(hit);
			this._canvas.style.cursor = CURSOR.GRABBING;
			this._onChange();
		}
	};

	private _onMouseMove = (event: MouseEvent): void => {
		if (this._dragIndex === null) {
			// hovering a point shows it can be grabbed; panning owns the cursor otherwise
			if (!this._transformService.isPanModeActive) {
				this._canvas.style.cursor = this._findPointAt({ x: event.offsetX, y: event.offsetY }) >= 0 ? CURSOR.GRAB : CURSOR.CROSSHAIR;
			}
			return;
		}

		if (this._pressScreen && Math.hypot(event.offsetX - this._pressScreen.x, event.offsetY - this._pressScreen.y) > CLICK_TOLERANCE) {
			this._moved = true;
		}

		if (!this._moved) {
			return;
		}

		const world = this._snap(this._toWorld(event), event);
		const point = this._getPoints()[this._dragIndex];
		point.x = world.x;
		point.y = world.y;
		this._onChange();
	};

	private _onMouseUp = (event: MouseEvent): void => {
		if (event.button !== LEFT_BUTTON) {
			return;
		}

		const wasDragging = this._dragIndex !== null;
		const wasClick = !this._moved;

		// a press on empty canvas that did not move is a click: add a point there
		if (!wasDragging && wasClick && this._pressScreen) {
			const world = this._snap(this._toWorld(event), event);
			const points = this._getPoints();
			points.push({ x: world.x, y: world.y });
			this._setSelectedIndex(points.length - 1);
			this._onChange();
		}

		this._reset();
	};

	private _onMouseLeave = (): void => {
		this._reset();
	};

	private _onKeyDown = (event: KeyboardEvent): void => {
		const selected = this._getSelectedIndex();
		if (selected === null || (event.key !== 'Delete' && event.key !== 'Backspace')) {
			return;
		}
		// let a focused number input keep its own Backspace / Delete
		const target = event.target as HTMLElement | null;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
			return;
		}

		this._getPoints().splice(selected, 1);
		this._setSelectedIndex(null);
		this._onChange();
	};

	private _reset(): void {
		this._dragIndex = null;
		this._pressScreen = null;
		this._moved = false;
		if (!this._transformService.isPanModeActive) {
			this._canvas.style.cursor = CURSOR.CROSSHAIR;
		}
	}
}
