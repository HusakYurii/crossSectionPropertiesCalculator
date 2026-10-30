import type { Point } from "../../../../../interfaces/common/types";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { drawArrowHead, getScaledSize } from "../drawUtils";

/** The look of a dimension. Every size is in screen pixels, and the class that extends this owns the numbers. */
export type DimensionStyle = {
	color: string;
	lineWidth: number;
	arrowHeadSize: number;
	/** length of a dash and of a gap in the dashed connector; only needed when a connector is drawn */
	dashSize?: number;
};

/** Where the lines of one dimension go, in world coordinates. */
export type DimensionGeometry = {
	/** the two ends of the dimension line, which carries an arrow head on each */
	from: Point;
	to: Point;
	/** solid lines from the measured points out to the dimension line */
	extensionLines?: [Point, Point][];
	/** a dashed line that ties the dimension back to the thing it measures */
	connector?: [Point, Point];
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

	protected constructor(uid: string, style: DimensionStyle) {
		this.uid = uid;
		this._style = style;
	}

	/** null when there is nothing to draw (a dimension whose shape is gone) */
	protected abstract _getGeometry(context: CanvasRenderingContext2D): DimensionGeometry | null;

	/** called last, after the lines and arrow heads, so a label can be drawn on top of them */
	protected abstract _drawLabel(context: CanvasRenderingContext2D, geometry: DimensionGeometry): void;

	draw(props: { context: CanvasRenderingContext2D }): void {
		const { context } = props;
		const geometry = this._getGeometry(context);
		if (!geometry) {
			return;
		}

		const strokeStyle = context.strokeStyle;
		const fillStyle = context.fillStyle;
		const lineWidth = context.lineWidth;
		const dash = context.getLineDash();

		const { color, lineWidth: screenLineWidth, arrowHeadSize, dashSize = DEFAULT_DASH_SIZE } = this._style;
		const { from, to, extensionLines, connector } = geometry;

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

		drawArrowHead(context, from, to, arrowHeadSize);
		drawArrowHead(context, to, from, arrowHeadSize);

		this._drawLabel(context, geometry);

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
		context.setLineDash(dash);
	}
}
