import type { Point, Service } from "../../../../interfaces/common/types";
import type { CanvasTransformService } from "../../../middle/view/services/CanvasTransformService";
import type { InputService } from "../../../middle/view/services/InputService";
import { CURSOR, MOUSE_BUTTON, POLYGON_EDITOR_INTERACTION } from "../../../../constants/canvasInteraction";
import { getSnapStep, snapPoint } from "../../../middle/view/canvas/gridSnap";
import { roundTo } from "../csv/csvTextParser";

type PolygonEditorProps = {
	canvas: HTMLCanvasElement;
	inputService: InputService;
	transformService: CanvasTransformService;
	/** the points being edited; the editor mutates this array in place */
	getPoints: () => Point[];
	getSelectedIndices: () => number[];
	/** always receives a new sorted array, never a mutated one */
	setSelectedIndices: (indices: number[]) => void;
	onChange: () => void;
};

/**
 * Click on empty canvas to add a point, drag a point to move it, drag on empty canvas to box-select
 * several (they then move together). Pan / zoom is left to CanvasTransformService (right button + wheel).
 * Hold Shift to snap to the grid, Cmd/Ctrl to add to the selection.
 */
export class PolygonEditor implements Service {
	private _canvas: HTMLCanvasElement;
	private _inputService: InputService;
	private _transformService: CanvasTransformService;
	private _getPoints: () => Point[];
	private _getSelectedIndices: () => number[];
	private _setSelectedIndices: (indices: number[]) => void;
	private _onChange: () => void;

	private _unsubscribeHandlers: Array<() => void> = [];
	private _active = false;

	// the grabbed point is the anchor: only it is snapped, the rest keep their offset from it
	private _dragIndex: number | null = null;
	// plain copies, the points themselves are reactive proxies that change while dragging
	private _dragStart = new Map<number, Point>();
	// screen coordinates, so a zoom during the drag cannot move the box away from the cursor
	private _boxStart: Point | null = null;
	private _boxEnd: Point | null = null;
	private _pressHit = -1;
	private _pressModifier = false;
	private _pressScreen: Point | null = null;
	private _moved = false;

	constructor(props: PolygonEditorProps) {
		this._canvas = props.canvas;
		this._inputService = props.inputService;
		this._transformService = props.transformService;
		this._getPoints = props.getPoints;
		this._getSelectedIndices = props.getSelectedIndices;
		this._setSelectedIndices = props.setSelectedIndices;
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
			if (Math.hypot(s.x - screen.x, s.y - screen.y) <= POLYGON_EDITOR_INTERACTION.HIT_RADIUS) {
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

	/** imported and typed points may have decimals (0.001 mm); a dragged or added point lands on a whole number, and Shift snaps it to the grid lines instead */
	private _snap(point: Point, event: MouseEvent): Point {
		return snapPoint(point, getSnapStep(event));
	}

	/** world-space box of the running selection drag, or null before the click tolerance is passed */
	getSelectionBox(): { min: Point; max: Point } | null {
		if (!this._boxStart || !this._boxEnd) {
			return null;
		}

		// converted now, because the wheel can zoom during the drag
		const a = this._transformService.screenToWorld(this._boxStart);
		const b = this._transformService.screenToWorld(this._boxEnd);
		// y is flipped on the canvas, so the corners are sorted in world space too
		return {
			min: { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y) },
			max: { x: Math.max(a.x, b.x), y: Math.max(a.y, b.y) },
		};
	}

	/** the Shift key is taken by grid snapping, and Ctrl+click is a right click on Mac */
	private _hasModifier(event: MouseEvent): boolean {
		return event.metaKey || event.ctrlKey;
	}

	private _onMouseDown = (event: MouseEvent): void => {
		if (event.button !== MOUSE_BUTTON.LEFT) {
			return;
		}

		const screen = { x: event.offsetX, y: event.offsetY };
		this._pressScreen = screen;
		this._moved = false;
		this._pressModifier = this._hasModifier(event);

		const hit = this._findPointAt(screen);
		this._pressHit = hit;
		if (hit < 0) {
			// empty space: a click adds a point, a drag draws a box; the selection waits for the mouse up
			return;
		}

		const selected = this._getSelectedIndices();
		let next = selected;
		if (this._pressModifier) {
			next = selected.includes(hit)
				? selected.filter((i) => i !== hit)
				: [...selected, hit].sort((a, b) => a - b);
		} else if (!selected.includes(hit)) {
			next = [hit];
		}
		if (next !== selected) {
			this._setSelectedIndices(next);
		}

		// a point that was just deselected is not grabbed
		if (!next.includes(hit)) {
			this._onChange();
			return;
		}

		const points = this._getPoints();
		this._dragIndex = hit;
		this._dragStart = new Map(next.map((i) => [i, { x: points[i].x, y: points[i].y }]));
		this._canvas.style.cursor = CURSOR.GRABBING;
		this._onChange();
	};

	private _onMouseMove = (event: MouseEvent): void => {
		const screen = { x: event.offsetX, y: event.offsetY };
		if (this._pressScreen && !this._moved && Math.hypot(screen.x - this._pressScreen.x, screen.y - this._pressScreen.y) > POLYGON_EDITOR_INTERACTION.CLICK_TOLERANCE) {
			this._moved = true;
		}

		if (this._dragIndex !== null) {
			if (this._moved) {
				this._dragSelected(event);
			}
			return;
		}

		if (this._pressScreen && this._pressHit < 0 && this._moved) {
			this._boxStart = this._pressScreen;
			this._boxEnd = screen;
			this._onChange();
			return;
		}

		// hovering a point shows it can be grabbed; panning owns the cursor otherwise
		if (!this._transformService.isPanModeActive) {
			this._canvas.style.cursor = this._findPointAt(screen) >= 0 ? CURSOR.GRAB : CURSOR.CROSSHAIR;
		}
	};

	private _dragSelected(event: MouseEvent): void {
		const anchorStart = this._dragStart.get(this._dragIndex!);
		if (!anchorStart) {
			return;
		}

		const snapped = this._snap(this._toWorld(event), event);
		const dx = snapped.x - anchorStart.x;
		const dy = snapped.y - anchorStart.y;
		const points = this._getPoints();
		for (const [index, start] of this._dragStart) {
			const point = points[index];
			if (!point) {
				continue;
			}
			// rounded so a shifted point does not pick up float noise like 12.700000000000001
			point.x = roundTo(start.x + dx, 3);
			point.y = roundTo(start.y + dy, 3);
		}
		this._onChange();
	}

	private _onMouseUp = (event: MouseEvent): void => {
		if (event.button !== MOUSE_BUTTON.LEFT) {
			return;
		}

		if (this._boxStart && this._boxEnd) {
			this._selectInBox(this._boxStart, this._boxEnd);
		} else if (this._pressHit >= 0) {
			// a plain click on a selected point narrows the group down to it
			if (!this._moved && !this._pressModifier && this._dragIndex !== null) {
				this._setSelectedIndices([this._pressHit]);
			}
		} else if (!this._moved && this._pressScreen) {
			// a press on empty canvas that did not move is a click: add a point there
			const world = this._snap(this._toWorld(event), event);
			const points = this._getPoints();
			points.push({ x: world.x, y: world.y });
			this._setSelectedIndices([points.length - 1]);
			this._onChange();
		}

		this._reset();
	};

	private _selectInBox(a: Point, b: Point): void {
		const minX = Math.min(a.x, b.x);
		const maxX = Math.max(a.x, b.x);
		const minY = Math.min(a.y, b.y);
		const maxY = Math.max(a.y, b.y);

		const inside: number[] = [];
		this._getPoints().forEach((point, index) => {
			const s = this._worldToScreen(point);
			if (s.x >= minX && s.x <= maxX && s.y >= minY && s.y <= maxY) {
				inside.push(index);
			}
		});

		if (this._pressModifier) {
			if (inside.length > 0) {
				const union = new Set([...this._getSelectedIndices(), ...inside]);
				this._setSelectedIndices([...union].sort((x, y) => x - y));
			}
		} else {
			this._setSelectedIndices(inside);
		}
	}

	private _onMouseLeave = (): void => {
		this._reset();
	};

	private _onKeyDown = (event: KeyboardEvent): void => {
		const selected = this._getSelectedIndices();
		if (selected.length === 0 || (event.key !== 'Delete' && event.key !== 'Backspace')) {
			return;
		}
		// let a focused number input keep its own Backspace / Delete
		const target = event.target as HTMLElement | null;
		if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
			return;
		}

		// highest first, so the indices still to remove do not shift
		const points = this._getPoints();
		for (let i = selected.length - 1; i >= 0; i--) {
			points.splice(selected[i], 1);
		}
		this._setSelectedIndices([]);
		this._onChange();
	};

	private _reset(): void {
		const hadBox = this._boxStart !== null;
		this._dragIndex = null;
		this._dragStart = new Map();
		this._boxStart = null;
		this._boxEnd = null;
		this._pressHit = -1;
		this._pressModifier = false;
		this._pressScreen = null;
		this._moved = false;
		if (!this._transformService.isPanModeActive) {
			this._canvas.style.cursor = CURSOR.CROSSHAIR;
		}
		// the box is drawn from the editor state, so it needs one more repaint to disappear
		if (hadBox) {
			this._onChange();
		}
	}
}
