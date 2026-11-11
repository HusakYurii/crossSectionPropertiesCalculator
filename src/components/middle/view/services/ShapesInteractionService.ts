import type { DrawTarget, Point, Service } from '../../../../interfaces/common/types';
import type { BeamsDrawTargetCollection } from '../canvas/BeamsDrawTargetCollection';
import { GenericBeamView } from '../beams';
import { CURSOR } from '../canvas/constants/cursors';
import { DRAG_THRESHOLD } from '../canvas/constants/dragThreshold';
import { getSnapStep, snapValue } from '../canvas/gridSnap';
import type { InputService } from './InputService';

type ShapesInteractionServiceProps = {
	canvas: HTMLCanvasElement;
	drawTargets: BeamsDrawTargetCollection;
	inputService: InputService;
	setSelectedShapeID: (uid: string | null) => void;
	screenToWorld: (point: Point) => Point;
	isTransformModeActive: () => boolean;
	/**
	 * Something else the user can grab (an arrow label) sits at this point. A click there is not a
	 * click on empty canvas, so it must not deselect the shape. Optional: without it every click that
	 * misses a beam counts as empty.
	 */
	isOverOtherInteractive?: (point: Point) => boolean;
	/** that other grabbable thing is being dragged right now, so the cursor shows it is held */
	isOtherInteractiveDragging?: () => boolean;
	onChange: () => void;
	/** 
	 *  A drag of a label ended (mouse up or mouse leave), switching windows mid-drag sends no mouse up or leave
	 * */
	onDragEnd: () => void;
};

export class ShapesInteractionService implements Service {



	private _canvas: HTMLCanvasElement;
	private _drawTargets: BeamsDrawTargetCollection;
	private _inputService: InputService;
	private _mouseWorldPosition?: Point;
	private _draggedShape: GenericBeamView | null = null;
	private _dragOffset: Point = { x: 0, y: 0 };
	// where the press happened in screen pixels; the shape stays put until the mouse has travelled past the threshold
	private _dragStartScreenPosition: Point = { x: 0, y: 0 };
	private _hasPassedThreshold = false;
	private _unsubscribeHandlers: Array<() => void> = [];
	private _active = false;
	// this is what we have after doing hit test when a user hovers / drags shapes
	private _cachedShapeHighlights: string[] = [];

	private _setSelectedShapeID: (uid: string | null) => void;
	private _screenToWorld: (point: Point) => Point;
	private _isTransformModeActive: () => boolean;
	private _isOverOtherInteractive: (point: Point) => boolean;
	private _isOtherInteractiveDragging: () => boolean;
	private _onChange: () => void;
	private _onDragEnd: () => void;

	constructor(props: ShapesInteractionServiceProps) {
		this._canvas = props.canvas;
		this._drawTargets = props.drawTargets;
		this._inputService = props.inputService;
		this._setSelectedShapeID = props.setSelectedShapeID;
		this._screenToWorld = props.screenToWorld;
		this._isTransformModeActive = props.isTransformModeActive;
		this._isOverOtherInteractive = props.isOverOtherInteractive ?? (() => false);
		this._isOtherInteractiveDragging = props.isOtherInteractiveDragging ?? (() => false);
		this._onChange = props.onChange;
		this._onDragEnd = props.onDragEnd;
	}

	get shapeHighlights(): ReadonlyArray<string> {
		return this._cachedShapeHighlights;
	}

	get isDragging(): boolean {
		return this._draggedShape !== null;
	}

	get mouseWorldPosition(): Point | undefined {
		return this._mouseWorldPosition;
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
			this._inputService.onWindowBlur(this._onMouseLeave),
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
		this._draggedShape = null;
		this._mouseWorldPosition = undefined;
		this._canvas.style.cursor = CURSOR.DEFAULT;
		this._active = false;
		this._onChange();
	}

	getHitsForShapes(targets: readonly DrawTarget[], mousePosition?: Point) {
		const hits: boolean[] = Array.from({ length: targets.length });

		if (this._isTransformModeActive()) {
			return hits;
		}

		for (let i = targets.length - 1; i >= 0 && mousePosition; i--) {
			const item = targets[i];
			const isHit = item.contains(mousePosition);

			hits[i] = isHit;

			if (isHit) {
				break;
			}

		}

		return hits;

	}

	private _findDraggableShapeAt(point: Point): GenericBeamView | undefined {
		const targets = this._drawTargets.getTargets();
		const hits = this.getHitsForShapes(targets, point);

		for (let i = hits.length - 1; i >= 0; i--) {
			if (!hits[i]) {
				continue;
			}

			const target = targets[i];
			return target;
		}
	}

	private _wouldCollideAt(shape: GenericBeamView, position: Point): boolean {
		const candidatePolygon = shape.getPathPointsAtPosition(position);

		for (const target of this._drawTargets.getTargets()) {
			if (target === shape) {
				continue;
			}

			if (target.isNegative) {
				continue;
			}

			if (target.intersect(candidatePolygon)) {
				return true;
			}
		}

		return false;
	}

	/** whether a shape can sit at this position: a negative shape goes anywhere, a solid one must not overlap another solid one */
	canMoveTo(uid: string, position: Point): boolean {
		const shape = this._drawTargets.getTargets().find((target) => target.uid === uid);
		if (!shape) {
			return false;
		}

		return shape.isNegative || !this._wouldCollideAt(shape, position);
	}

	private _onMouseDown = (event: MouseEvent): void => {
		if (event.button !== 0 || this._isTransformModeActive()) {
			return;
		}

		const worldPosition = this._screenToWorld({ x: event.offsetX, y: event.offsetY });

		// labels are checked first: a label over a shape is dragged on its own and the shape stays put
		if (this._isOverOtherInteractive(worldPosition)) {
			this._canvas.style.cursor = CURSOR.GRABBING;
			return;
		}

		const shape = this._findDraggableShapeAt(worldPosition);

		if (!shape) {
			// a click on empty canvas deselects
			this._setSelectedShapeID(null);
			return;
		}

		this._draggedShape = shape;
		this._dragOffset = {
			x: worldPosition.x - shape.position.x,
			y: worldPosition.y - shape.position.y,
		};

		this._dragStartScreenPosition = { x: event.offsetX, y: event.offsetY };
		this._hasPassedThreshold = false;

		this._setSelectedShapeID(shape.uid);
		this._canvas.style.cursor = CURSOR.GRABBING;
	};

	private _onMouseMove = (event: MouseEvent): void => {
		const worldPosition = this._screenToWorld({ x: event.offsetX, y: event.offsetY });
		this._mouseWorldPosition = worldPosition;

		if (this._draggedShape && !this._hasPassedThreshold) {
			const dx = event.offsetX - this._dragStartScreenPosition.x;
			const dy = event.offsetY - this._dragStartScreenPosition.y;
			this._hasPassedThreshold = Math.hypot(dx, dy) >= DRAG_THRESHOLD;
		}

		if (this._draggedShape && this._hasPassedThreshold) {
			// whole numbers while dragging; Shift snaps the shape's position to the grid lines
			const step = getSnapStep(event);
			const nextPosition = {
				x: snapValue(worldPosition.x - this._dragOffset.x, step),
				y: snapValue(worldPosition.y - this._dragOffset.y, step),
			};

			if (this._draggedShape.isNegative) {
				this._draggedShape.setPosition(nextPosition);
			}
			else if (!this._wouldCollideAt(this._draggedShape, nextPosition)) {
				this._draggedShape.setPosition(nextPosition);
			}

		}

		this._updateCursor(worldPosition);
		this._onChange();
	};

	/**
	 * panning owns the cursor while it is on; otherwise a held beam or label shows grabbing and one under
	 * the mouse shows it can be grabbed. On release nothing is held any more, even if the label service
	 * has not heard about the mouse up yet.
	 */
	private _updateCursor(worldPosition: Point, isReleased = false): void {
		if (this._isTransformModeActive()) {
			return;
		}

		if (!isReleased && (this._draggedShape || this._isOtherInteractiveDragging())) {
			this._canvas.style.cursor = CURSOR.GRABBING;
			return;
		}

		const canGrab = this._isOverOtherInteractive(worldPosition) || this._findDraggableShapeAt(worldPosition);
		this._canvas.style.cursor = canGrab ? CURSOR.GRAB : CURSOR.DEFAULT;
	}

	private _onMouseUp = (event: MouseEvent): void => {
		if (event.button !== 0) {
			return;
		}

		const wasDragging = this.isDragging;
		this._draggedShape = null;
		this._updateCursor(this._screenToWorld({ x: event.offsetX, y: event.offsetY }), true);
		this._onChange();
		wasDragging && this._onDragEnd();
	};

	private _onMouseLeave = (): void => {
		const wasDragging = this.isDragging;
		this._draggedShape = null;
		this._mouseWorldPosition = undefined;
		this._canvas.style.cursor = CURSOR.DEFAULT;
		this._onChange();
		wasDragging && this._onDragEnd();
	};
}
