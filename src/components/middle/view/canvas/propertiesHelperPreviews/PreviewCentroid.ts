import type { Point } from "../../../../../interfaces/common/types";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { drawOriginCross } from "../drawUtils";
import { CENTROID_STYLE } from "../../../../../constants/canvasStyle";

export type PreviewCentroidOptions = {
	/** in screen px */
	lineWidth?: number;
	/** in screen px */
	size?: number;
};

/** Small cross on the shape centroid, for a canvas that draws the shape where it is and not centered on it. */
export class PreviewCentroid implements DrawableTarget {
	public readonly uid = 'preview-centroid';

	private _center: Point = { x: 0, y: 0 };
	private _visible = true;
	private _lineWidth: number;
	private _size: number;

	constructor(options: PreviewCentroidOptions = {}) {
		this._lineWidth = options.lineWidth ?? CENTROID_STYLE.LINE_WIDTH;
		this._size = options.size ?? CENTROID_STYLE.CROSS_SIZE;
	}

	setVisible(visible: boolean): void {
		this._visible = visible;
	}

	setCenter(center: Point): void {
		this._center = { x: center.x, y: center.y };
	}

	draw(props: { context: CanvasRenderingContext2D }): void {
		if (!this._visible) {
			return;
		}

		drawOriginCross(props.context, this._center, CENTROID_STYLE.COLOR, this._size, this._lineWidth);
	}
}
