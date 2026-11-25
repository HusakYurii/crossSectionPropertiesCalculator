import type { Point, Service } from '../../../../interfaces/common/types';
import { CURSOR, DRAG_THRESHOLD, MOUSE_BUTTON, OBJECT_SNAP } from '../../../../constants/canvasInteraction';
import { roundTo } from '../../../../mathUtils/round';
import type { ObjectSnapMarkerModel } from '../canvas/objectSnap/ObjectSnapMarkers';
import type { InputService } from './InputService';
import { isImeComposing } from '../../../../services/singletons/NativeHotKeysService';

type ObjectSnapInteractionServiceProps = {
	inputService: InputService;
	/** only for the cursor */
	canvas: HTMLCanvasElement;
	/** whether an object snap is on (Endpoint) */
	isEnabled: () => boolean;
	hasShape: (uid: string) => boolean;
	/** the raw polygon of a shape; a new array (undo, import) tells that the shape was replaced */
	getPolygonRef: (uid: string) => Point[] | undefined;
	/** shape ids in z-order, the last one is on top */
	getShapeIds: () => string[];
	/** the points of a shape relative to its centroid, so world = position + offset */
	getVertexOffsets: (uid: string) => Point[];
	getPosition: (uid: string) => Point | null;
	worldToScreen: (point: Point) => Point;
	screenToWorld: (point: Point) => Point;
	isTransformModeActive: () => boolean;
	isOverLabel: (world: Point) => boolean;
	/** moves the shape so that its picked point lands on the other one */
	onSnap: (uid: string, position: Point) => void;
	onChange: () => void;
};

/** a point of a shape; `polygon` and `offset` are kept to notice that the shape changed after the pick */
type VertexRef = { uid: string; index: number; offset: Point; polygon: Point[] };
type VertexKey = { uid: string; index: number };

// offsets closer than this (mm) are the same
const SAME_OFFSET_TOLERANCE = 1e-9;

/**
 * Endpoint snap of the main canvas: a click on a point of one shape, then a click on a point of another,
 * moves the first shape so that the two points coincide. The state is in memory only. Never moves a shape
 * by a drag: a pick is a press and release that never passed DRAG_THRESHOLD, which is also when the
 * ShapesInteractionService starts to move the shape.
 */
export class ObjectSnapInteractionService implements Service {
	private _inputService: InputService;
	private _canvas: HTMLCanvasElement;
	private _isEnabled: () => boolean;
	private _hasShape: (uid: string) => boolean;
	private _getPolygonRef: (uid: string) => Point[] | undefined;
	private _getShapeIds: () => string[];
	private _getVertexOffsets: (uid: string) => Point[];
	private _getPosition: (uid: string) => Point | null;
	private _worldToScreen: (point: Point) => Point;
	private _screenToWorld: (point: Point) => Point;
	private _isTransformModeActive: () => boolean;
	private _isOverLabel: (world: Point) => boolean;
	private _onSnap: (uid: string, position: Point) => void;
	private _onChange: () => void;

	private _unsubscribeHandlers: Array<() => void> = [];
	private _active = false;

	private _selected: VertexRef | null = null;
	private _hovered: VertexKey | null = null;
	private _pressActive = false;
	private _pressMoved = false;
	private _pressScreen: Point = { x: 0, y: 0 };
	private _pressVertex: VertexRef | null = null;

	constructor(props: ObjectSnapInteractionServiceProps) {
		this._inputService = props.inputService;
		this._canvas = props.canvas;
		this._isEnabled = props.isEnabled;
		this._hasShape = props.hasShape;
		this._getPolygonRef = props.getPolygonRef;
		this._getShapeIds = props.getShapeIds;
		this._getVertexOffsets = props.getVertexOffsets;
		this._getPosition = props.getPosition;
		this._worldToScreen = props.worldToScreen;
		this._screenToWorld = props.screenToWorld;
		this._isTransformModeActive = props.isTransformModeActive;
		this._isOverLabel = props.isOverLabel;
		this._onSnap = props.onSnap;
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
			this._inputService.onWindowBlur(this._onMouseLeave),
			this._inputService.onKeyDown(this._onKeyDown),
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
		this._selected = null;
		this._hovered = null;
		this._pressActive = false;
		this._pressMoved = false;
		this._pressVertex = null;
		this._active = false;
	}

	/** drops the picked point, e.g. when the snap is turned off */
	clearSelection(): void {
		this._selected = null;
		this._pressVertex = null;
		this._onChange();
	}

	/**
	 * What the marker drawing needs, or null while the snap is off. Called from the redraw, so it never calls onChange.
	 */
	getMarkerModel(): ObjectSnapMarkerModel | null {
		if (!this._isEnabled()) {
			return null;
		}

		this._dropInvalidState();
		const shapes: ObjectSnapMarkerModel['shapes'] = [];
		for (const uid of this._getShapeIds()) {
			const position = this._getPosition(uid);
			if (!position) {
				continue;
			}
			shapes.push({ uid, points: this._getVertexOffsets(uid).map((o) => ({ x: position.x + o.x, y: position.y + o.y })) });
		}

		return { shapes, selected: this._toWorld(this._selected), hovered: this._toWorld(this._hovered) };
	}

	private _toWorld(vertex: VertexKey | null): Point | null {
		if (!vertex) {
			return null;
		}
		const position = this._getPosition(vertex.uid);
		const offset = this._getVertexOffsets(vertex.uid)[vertex.index];
		return position && offset ? { x: position.x + offset.x, y: position.y + offset.y } : null;
	}

	private _isValidRef(ref: VertexRef): boolean {
		if (!this._hasShape(ref.uid) || this._getPolygonRef(ref.uid) !== ref.polygon) {
			return false;
		}
		const offset = this._getVertexOffsets(ref.uid)[ref.index];
		return !!offset && Math.abs(offset.x - ref.offset.x) <= SAME_OFFSET_TOLERANCE && Math.abs(offset.y - ref.offset.y) <= SAME_OFFSET_TOLERANCE;
	}

	private _isValidHovered(vertex: VertexKey): boolean {
		return this._hasShape(vertex.uid) && vertex.index < this._getVertexOffsets(vertex.uid).length;
	}

	/** a shape may have been undone, deleted, edited or imported; never calls onChange, it runs inside the redraw */
	private _dropInvalidState(): void {
		if (this._selected && !this._isValidRef(this._selected)) {
			this._selected = null;
		}
		if (this._hovered && !this._isValidHovered(this._hovered)) {
			this._hovered = null;
		}
	}

	private _findVertexAt(screen: Point): VertexRef | null {
		if (this._isOverLabel(this._screenToWorld(screen))) {
			return null;
		}

		this._dropInvalidState();
		const candidates: Array<{ uid: string; index: number; offset: Point; z: number; d: number }> = [];
		this._getShapeIds().forEach((uid, z) => {
			const position = this._getPosition(uid);
			if (!position) {
				return;
			}
			this._getVertexOffsets(uid).forEach((offset, index) => {
				const onScreen = this._worldToScreen({ x: position.x + offset.x, y: position.y + offset.y });
				const d = Math.hypot(onScreen.x - screen.x, onScreen.y - screen.y);
				d <= OBJECT_SNAP.HIT_RADIUS && candidates.push({ uid, index, offset, z, d });
			});
		});
		if (candidates.length === 0) {
			return null;
		}

		const dMin = Math.min(...candidates.map((c) => c.d));
		let group = candidates.filter((c) => c.d <= dMin + OBJECT_SNAP.TIE_TOLERANCE);

		const selected = this._selected;
		if (selected) {
			// a coincident point of another shape is what a snap is for
			const others = group.filter((c) => c.uid !== selected.uid);
			if (others.length > 0) {
				group = others;
			} else {
				// otherwise the red point itself, so it can always be toggled off
				const same = group.find((c) => c.uid === selected.uid && c.index === selected.index);
				if (same) {
					group = [same];
				}
			}
		}

		const best = group.reduce((a, b) => (b.z > a.z || (b.z === a.z && b.d < a.d) ? b : a));
		const polygon = this._getPolygonRef(best.uid);
		return polygon ? { uid: best.uid, index: best.index, offset: best.offset, polygon } : null;
	}

	private _setHovered(vertex: VertexKey | null): void {
		const current = this._hovered;
		if (current?.uid === vertex?.uid && current?.index === vertex?.index) {
			return;
		}
		this._hovered = vertex ? { uid: vertex.uid, index: vertex.index } : null;
		this._onChange();
	}

	private _handleClick(vertex: VertexRef | null): void {
		this._dropInvalidState();
		const selected = this._selected;

		if (!vertex || !selected) {
			// empty canvas, a shape body or a label clears; the first point picked is set
			this._selected = vertex;
			this._onChange();
			return;
		}
		if (vertex.uid === selected.uid) {
			// the same point again deselects it; another point of the same shape does nothing
			if (vertex.index === selected.index) {
				this._selected = null;
				this._onChange();
			}
			return;
		}

		const posA = this._getPosition(selected.uid);
		const posB = this._getPosition(vertex.uid);
		this._selected = null;
		if (posA && posB) {
			// not the grid snap: the two points must coincide
			const next = {
				x: roundTo(posB.x + vertex.offset.x - selected.offset.x, OBJECT_SNAP.DECIMALS),
				y: roundTo(posB.y + vertex.offset.y - selected.offset.y, OBJECT_SNAP.DECIMALS),
			};
			// a snap that changes nothing writes no undo step
			if (Math.abs(next.x - posA.x) > SAME_OFFSET_TOLERANCE || Math.abs(next.y - posA.y) > SAME_OFFSET_TOLERANCE) {
				this._onSnap(selected.uid, next);
			}
		}
		this._onChange();
	}

	private _onMouseDown = (event: MouseEvent): void => {
		if (!this._isEnabled()) {
			this._pressActive = false;
			this._setHovered(null);
			return;
		}
		if (event.button === MOUSE_BUTTON.PAN) {
			// a pan that starts mid-press cancels the pick
			this._pressActive && (this._pressMoved = true);
			return;
		}
		if (event.button !== MOUSE_BUTTON.LEFT || this._isTransformModeActive()) {
			return;
		}

		this._pressActive = true;
		this._pressMoved = false;
		this._pressScreen = { x: event.offsetX, y: event.offsetY };
		this._pressVertex = this._findVertexAt(this._pressScreen);
	};

	private _onMouseMove = (event: MouseEvent): void => {
		if (!this._isEnabled()) {
			this._pressActive = false;
			this._setHovered(null);
			return;
		}
		if (this._isTransformModeActive()) {
			// panning owns the cursor
			this._pressActive && (this._pressMoved = true);
			this._setHovered(null);
			return;
		}
		if (this._pressActive) {
			// the same measure as the shape service, so the shape moves exactly when the pick is cancelled
			if (!this._pressMoved && Math.hypot(event.offsetX - this._pressScreen.x, event.offsetY - this._pressScreen.y) >= DRAG_THRESHOLD) {
				this._pressMoved = true;
				this._setHovered(null);
			}
			return;
		}
		// a press that started outside the canvas
		if (event.buttons !== 0) {
			return;
		}

		this._setHovered(this._findVertexAt({ x: event.offsetX, y: event.offsetY }));
		// only the crosshair, never another cursor: the one of the shape service stands
		this._hovered && (this._canvas.style.cursor = CURSOR.CROSSHAIR);
	};

	private _onMouseUp = (event: MouseEvent): void => {
		if (event.button !== MOUSE_BUTTON.LEFT) {
			return;
		}

		// the second click of a double click is ignored
		const isClick = this._pressActive && !this._pressMoved && this._isEnabled() && !this._isTransformModeActive() && event.detail <= 1;
		this._pressActive = false;
		if (isClick) {
			// an undo may have happened mid-press
			this._handleClick(this._pressVertex && this._isValidRef(this._pressVertex) ? this._pressVertex : null);
		}

		// after the cursor of the shape service, and after a snap moved a shape under the mouse
		if (this._isEnabled() && !this._isTransformModeActive()) {
			this._setHovered(this._findVertexAt({ x: event.offsetX, y: event.offsetY }));
			this._hovered && (this._canvas.style.cursor = CURSOR.CROSSHAIR);
		}
	};

	private _onMouseLeave = (): void => {
		this._pressActive = false;
		this._setHovered(null);
	};

	private _onKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== 'Escape' || event.repeat || isImeComposing(event)) {
			return;
		}
		if (!this._selected || !this._isEnabled() || event.defaultPrevented) {
			return;
		}
		// typing in a field keeps its own Escape
		const target = event.target;
		if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
			return;
		}

		this.clearSelection();
	};
}
