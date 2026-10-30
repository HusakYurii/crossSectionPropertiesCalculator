import type { Point, Service } from '../../../../interfaces/common/types';
import type { DrawTargetsCollection } from '../canvas/DrawTargetsCollection';
import type { DimensionsWithTextLabel } from '../canvas/annotations/DimensionsWithTextLabel';
import type { InputService } from './InputService';

type DimensionsWithTextLabelInteractionServiceProps = {
	drawTargets: DrawTargetsCollection<DimensionsWithTextLabel>;
	inputService: InputService;
	screenToWorld: (point: Point) => Point;
	isTransformModeActive: () => boolean;
	onChange: () => void;
};

/**
 * Lets a user grab an DimensionsWithTextLabel and drag it perpendicular to its own axis
 * (X-axis labels slide along Y, Y-axis labels slide along X). Mirrors
 * ShapesInteractionService's subscribe/hit-test/drag lifecycle.
 */
export class DimensionsWithTextLabelInteractionService implements Service {
	private _drawTargets: DrawTargetsCollection<DimensionsWithTextLabel>;
	private _inputService: InputService;
	private _screenToWorld: (point: Point) => Point;
	private _isTransformModeActive: () => boolean;
	private _onChange: () => void;

	private _unsubscribeHandlers: Array<() => void> = [];
	private _active = false;

	private _draggedLabel: DimensionsWithTextLabel | null = null;
	private _hoveredLabel: DimensionsWithTextLabel | null = null;
	private _dragStartOffset = 0;
	private _dragStartWorldPosition: Point = { x: 0, y: 0 };

	constructor(props: DimensionsWithTextLabelInteractionServiceProps) {
		this._drawTargets = props.drawTargets;
		this._inputService = props.inputService;
		this._screenToWorld = props.screenToWorld;
		this._isTransformModeActive = props.isTransformModeActive;
		this._onChange = props.onChange;
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
		this._dragStartWorldPosition = worldPosition;
	};

	private _onMouseMove = (event: MouseEvent): void => {
		const worldPosition = this._screenToWorld({ x: event.offsetX, y: event.offsetY });

		if (!this._draggedLabel) {
			this._setHoveredLabel(this._isTransformModeActive() ? null : this._findLabelAt(worldPosition) ?? null);
			return;
		}

		const delta = this._draggedLabel.axis === 'x'
			? worldPosition.y - this._dragStartWorldPosition.y
			: worldPosition.x - this._dragStartWorldPosition.x;

		this._draggedLabel.setOffset(this._dragStartOffset + delta);
		this._onChange();
	};

	private _onMouseUp = (event: MouseEvent): void => {
		if (event.button !== 0) {
			return;
		}

		this._draggedLabel = null;
		// the label may have been dropped away from the mouse, so the hover is checked again
		const worldPosition = this._screenToWorld({ x: event.offsetX, y: event.offsetY });
		this._setHoveredLabel(this._findLabelAt(worldPosition) ?? null);
	};

	private _onMouseLeave = (): void => {
		this._draggedLabel = null;
		this._setHoveredLabel(null);
	};
}
