import type { Point, Service } from '../../../../interfaces/common/types';
import type { DrawTargetsCollection } from '../canvas/DrawTargetsCollection';
import type { DimensionsWithTextLabel } from '../canvas/annotations/DimensionsWithTextLabel';
import { DRAG_THRESHOLD } from '../canvas/constants/dragThreshold';
import type { InputService } from './InputService';

type DimensionsWithTextLabelInteractionServiceProps = {
	drawTargets: DrawTargetsCollection<DimensionsWithTextLabel>;
	inputService: InputService;
	screenToWorld: (point: Point) => Point;
	isTransformModeActive: () => boolean;
	onChange: () => void;
	/** 
	 *  A drag of a label ended (mouse up or mouse leave), switching windows mid-drag sends no mouse up or leave
	 * */
	onDragEnd: () => void;
	/** A label was double clicked, so its number can be edited */
	onEditRequest: (label: DimensionsWithTextLabel) => void;
};

// a dropped number this close (screen px) to its automatic spot goes back to automatic
const SNAP_TO_AUTO = 4;

/**
 * Lets a user grab an DimensionsWithTextLabel and drag it perpendicular to its own axis
 * (X-axis labels slide along Y, Y-axis labels slide along X) and along it. Mirrors
 * ShapesInteractionService's subscribe/hit-test/drag lifecycle.
 */
export class DimensionsWithTextLabelInteractionService implements Service {
	private _drawTargets: DrawTargetsCollection<DimensionsWithTextLabel>;
	private _inputService: InputService;
	private _screenToWorld: (point: Point) => Point;
	private _isTransformModeActive: () => boolean;
	private _onChange: () => void;
	private _onDragEnd: () => void;
	private _onEditRequest: (label: DimensionsWithTextLabel) => void;

	private _unsubscribeHandlers: Array<() => void> = [];
	private _active = false;

	private _draggedLabel: DimensionsWithTextLabel | null = null;
	private _hoveredLabel: DimensionsWithTextLabel | null = null;
	private _dragStartOffset = 0;
	private _dragStartAlong = 0;
	private _dragStartWorldPosition: Point = { x: 0, y: 0 };
	private _dragStartScreenPosition: Point = { x: 0, y: 0 };
	// each direction starts only after the mouse moved DRAG_THRESHOLD in it, so a slide with a shaky hand adds no offset
	private _hasMovedAlong = false;
	private _hasMovedAcross = false;

	constructor(props: DimensionsWithTextLabelInteractionServiceProps) {
		this._drawTargets = props.drawTargets;
		this._inputService = props.inputService;
		this._screenToWorld = props.screenToWorld;
		this._isTransformModeActive = props.isTransformModeActive;
		this._onChange = props.onChange;
		this._onDragEnd = props.onDragEnd;
		this._onEditRequest = props.onEditRequest;
	}

	get isDragging(): boolean {
		return this._draggedLabel !== null;
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
			this._inputService.onDoubleClick(this._onDoubleClick),
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
		this._draggedLabel = null;
		this._setHoveredLabel(null);
		this._active = false;
	}

	private _findLabelAt(point: Point): DimensionsWithTextLabel | undefined {
		const targets = this._drawTargets.getTargets();

		for (let i = targets.length - 1; i >= 0; i--) {
			if (targets[i].contains(point)) {
				return targets[i];
			}
		}

		return undefined;
	}

	/** the hovered (or dragged) label is drawn bold; redraws only when it changes */
	private _setHoveredLabel(label: DimensionsWithTextLabel | null): void {
		if (this._hoveredLabel === label) {
			return;
		}

		this._hoveredLabel?.setHighlighted(false);
		label?.setHighlighted(true);
		this._hoveredLabel = label;
		this._onChange();
	}

	private _onMouseDown = (event: MouseEvent): void => {
		if (event.button !== 0 || this._isTransformModeActive()) {
			return;
		}

		const worldPosition = this._screenToWorld({ x: event.offsetX, y: event.offsetY });
		const label = this._findLabelAt(worldPosition);

		if (!label) {
			return;
		}

		this._draggedLabel = label;
		this._setHoveredLabel(label);
		this._dragStartOffset = label.offset;
		this._dragStartAlong = label.along;
		this._dragStartWorldPosition = worldPosition;
		this._dragStartScreenPosition = { x: event.offsetX, y: event.offsetY };
		this._hasMovedAlong = false;
		this._hasMovedAcross = false;
	};

	private _onMouseMove = (event: MouseEvent): void => {
		const worldPosition = this._screenToWorld({ x: event.offsetX, y: event.offsetY });

		if (!this._draggedLabel) {
			this._setHoveredLabel(this._isTransformModeActive() ? null : this._findLabelAt(worldPosition) ?? null);
			return;
		}

		const label = this._draggedLabel;
		const isX = label.axis === 'x';
		const screenDx = event.offsetX - this._dragStartScreenPosition.x;
		const screenDy = event.offsetY - this._dragStartScreenPosition.y;
		const worldDx = worldPosition.x - this._dragStartWorldPosition.x;
		const worldDy = worldPosition.y - this._dragStartWorldPosition.y;

		this._hasMovedAlong ||= Math.abs(isX ? screenDx : screenDy) >= DRAG_THRESHOLD;
		this._hasMovedAcross ||= Math.abs(isX ? screenDy : screenDx) >= DRAG_THRESHOLD;
		if (!this._hasMovedAlong && !this._hasMovedAcross) {
			return;
		}

		this._hasMovedAcross && label.setOffset(this._dragStartOffset + (isX ? worldDy : worldDx));
		this._hasMovedAlong && label.setAlong(this._dragStartAlong + (isX ? worldDx : worldDy));
		this._onChange();
	};

	/** a number dropped near its automatic spot goes back to automatic */
	private _snapToAuto(label: DimensionsWithTextLabel): void {
		if (!this._hasMovedAlong) {
			return;
		}
		// the zoom at the drop, which a wheel during the drag may have changed
		const origin = this._screenToWorld({ x: 0, y: 0 });
		const onePixel = this._screenToWorld({ x: 1, y: 0 });
		const worldPerPixel = Math.abs(onePixel.x - origin.x);
		if (Math.abs(label.along - label.autoAlong) / worldPerPixel < SNAP_TO_AUTO) {
			label.resetAlong();
			this._onChange();
		}
	}

	private _onMouseUp = (event: MouseEvent): void => {
		if (event.button !== 0) {
			return;
		}

		const wasDragging = this.isDragging;
		this._draggedLabel && this._snapToAuto(this._draggedLabel);
		this._draggedLabel = null;
		// the label may have been dropped away from the mouse, so the hover is checked again
		const worldPosition = this._screenToWorld({ x: event.offsetX, y: event.offsetY });
		this._setHoveredLabel(this._findLabelAt(worldPosition) ?? null);
		wasDragging && this._onDragEnd();
	};

	private _onDoubleClick = (event: MouseEvent): void => {
		if (event.button !== 0 || this._isTransformModeActive()) {
			return;
		}

		const label = this._findLabelAt(this._screenToWorld({ x: event.offsetX, y: event.offsetY }));
		label && this._onEditRequest(label);
	};

	private _onMouseLeave = (): void => {
		const wasDragging = this.isDragging;
		this._draggedLabel && this._snapToAuto(this._draggedLabel);
		this._draggedLabel = null;
		this._setHoveredLabel(null);
		wasDragging && this._onDragEnd();
	};
}
