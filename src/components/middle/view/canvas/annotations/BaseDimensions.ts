import type { BoundingBox, Point } from "../../../../../interfaces/common/types";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { drawArrowHead, getScaledSize } from "../drawUtils";

/**
 * How a dimension looks. Sizes are in screen pixels and are scaled by the current zoom when drawn,
 * so the dimension keeps the same size on screen at any zoom. The subclass passes these in to the constructor.
 */
export type DimensionStyle = {
	color: string;
	lineWidth: number;
	/** length of each arrow head */
	arrowHeadSize: number;
	/** dash and gap length of the connector line; defaults to DEFAULT_DASH_SIZE */
	dashSize?: number;
};

/**
 * Where the lines of one dimension go, in world coordinates. A subclass may work them out from
 * screen-pixel offsets, so they hold only for the zoom they were computed at.
 */
export type DimensionGeometry = {
	/** one end of the dimension line; gets an arrow head */
	from: Point;
	/** the other end of the dimension line; gets an arrow head */
	to: Point;
	/** solid [start, end] lines, usually from a measured point to just past the dimension line */
	extensionLines?: [Point, Point][];
	/** a dashed [start, end] line, e.g. back to the measured point once the dimension line is moved away from it */
	connector?: [Point, Point];
	/**
	 * Unit vectors pointing away from the dimension at each end. When set, the arrow heads sit outside the
	 * ends and point inward, the tip on the end. The subclass gives them so that a zero length stays safe.
	 */
	arrowsOutside?: { fromOutward: Point; toOutward: Point };
};

const DEFAULT_DASH_SIZE = 6;

/**
 * Everything it takes to draw the lines of a dimension: extension lines, an optional dashed connector, the
 * dimension line itself and an arrow head at each end. What is written on it is left to the subclass, so
 * a dimension can carry a draggable number or a plain text box without repeating the line drawing.
 *
 * A subclass says where the lines go (`_getGeometry`) and what the label looks like (`_drawLabel`).
 */
export abstract class BaseDimensions implements DrawableTarget {
	public readonly uid: string;

	protected readonly _style: DimensionStyle;
	protected _cachedBoundingBox: BoundingBox | null = null;

	protected constructor(uid: string, style: DimensionStyle) {
		this.uid = uid;
		this._style = style;
	}

	/**
	 * World-space box around the lines only (from, to, connector and extension lines), not the label,
	 * as of the last draw. null before the first draw and while there is nothing to draw.
	 * A subclass whose geometry depends on zoom (DimensionsWithLabel) gets a box that is only accurate
	 * at the zoom it was last drawn at.
	 */
	get boundingBox() {
		return this._cachedBoundingBox;
	}

	/** null when there is nothing to draw (a dimension whose shape is gone) */
	protected abstract _getGeometry(context: CanvasRenderingContext2D): DimensionGeometry | null;

	/** called last, after the lines and arrow heads, so a label can be drawn on top of them */
	protected abstract _drawLabel(context: CanvasRenderingContext2D, geometry: DimensionGeometry): void;

	draw(props: { context: CanvasRenderingContext2D }): void {
		const { context } = props;
		const geometry = this._getGeometry(context);
		if (!geometry) {
			this._cachedBoundingBox = null;
			return;
		}

		this._recalculateBoundingBox(geometry);

		const strokeStyle = context.strokeStyle;
		const fillStyle = context.fillStyle;
		const lineWidth = context.lineWidth;
		const dash = context.getLineDash();

		const { color, lineWidth: screenLineWidth, arrowHeadSize, dashSize = DEFAULT_DASH_SIZE } = this._style;
		const { from, to, extensionLines, connector, arrowsOutside } = geometry;

		context.strokeStyle = color;
		context.fillStyle = color;
		context.lineWidth = getScaledSize(context, screenLineWidth);

		if (extensionLines && extensionLines.length > 0) {
			context.beginPath();
			for (const [start, end] of extensionLines) {
				context.moveTo(start.x, start.y);
				context.lineTo(end.x, end.y);
			}
			context.stroke();
		}

		if (connector) {
			const scaledDash = getScaledSize(context, dashSize);
			context.setLineDash([scaledDash, scaledDash]);
			context.beginPath();
			context.moveTo(connector[0].x, connector[0].y);
			context.lineTo(connector[1].x, connector[1].y);
			context.stroke();
			context.setLineDash([]);
		}

		context.beginPath();
		context.moveTo(from.x, from.y);
		context.lineTo(to.x, to.y);
		context.stroke();

		if (arrowsOutside) {
			const { fromOutward, toOutward } = arrowsOutside;
			drawArrowHead(context, { x: from.x + fromOutward.x, y: from.y + fromOutward.y }, from, arrowHeadSize);
			drawArrowHead(context, { x: to.x + toOutward.x, y: to.y + toOutward.y }, to, arrowHeadSize);
		} else {
			drawArrowHead(context, from, to, arrowHeadSize);
			drawArrowHead(context, to, from, arrowHeadSize);
		}

		this._drawLabel(context, geometry);

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
		context.setLineDash(dash);
	}

	protected _recalculateBoundingBox({ from, to, extensionLines, connector }: DimensionGeometry): void {
		const points = [from, to, ...(connector ?? []), ...(extensionLines ?? []).flat()];
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const { x, y } of points) {
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}

		this._cachedBoundingBox = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
	}
}
