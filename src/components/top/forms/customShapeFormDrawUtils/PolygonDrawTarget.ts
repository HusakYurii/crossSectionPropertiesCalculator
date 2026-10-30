import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { PIVOT, drawUprightText, getScaledSize } from "../../../middle/view/canvas/drawUtils";

const LINE_WIDTH = 2;
const POINT_RADIUS = 6;
const SELECTED_RING = 4;
const LABEL_FONT_SIZE = 16;
const LABEL_OFFSET = 12;
const FILL = 'rgba(109, 182, 49, 0.18)';
const STROKE = 'rgba(40, 90, 20, 1)';
const POINT = 'rgba(40, 90, 20, 1)';
const SELECTED = 'rgba(220, 60, 60, 1)';
const LABEL = 'rgba(0, 0, 0, 0.7)';

/**
 * Draws the polygon being edited: filled once it has 3 points, an open line before that,
 * then every vertex as a dot with its list number next to it.
 */
export class PolygonDrawTarget implements DrawableTarget {
	public readonly uid = 'custom-polygon';

	private _getPoints: () => Point[];
	private _getSelectedIndex: () => number | null;

	constructor(getPoints: () => Point[], getSelectedIndex: () => number | null) {
		this._getPoints = getPoints;
		this._getSelectedIndex = getSelectedIndex;
	}

	draw(props: { context: CanvasRenderingContext2D }): void {
		const { context } = props;
		const points = this._getPoints();
		if (points.length === 0) {
			return;
		}

		const strokeStyle = context.strokeStyle;
		const fillStyle = context.fillStyle;
		const lineWidth = context.lineWidth;

		context.lineWidth = getScaledSize(context, LINE_WIDTH);
		context.strokeStyle = STROKE;

		if (points.length >= 2) {
			context.beginPath();
			context.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				context.lineTo(points[i].x, points[i].y);
			}
			if (points.length >= 3) {
				context.closePath();
				context.fillStyle = FILL;
				context.fill();
			}
			context.stroke();
		}

		const selected = this._getSelectedIndex();
		points.forEach((point, index) => {
			const isSelected = index === selected;

			if (isSelected) {
				context.beginPath();
				context.arc(point.x, point.y, getScaledSize(context, POINT_RADIUS + SELECTED_RING), 0, Math.PI * 2);
				context.fillStyle = 'rgba(220, 60, 60, 0.25)';
				context.fill();
			}

			context.beginPath();
			context.arc(point.x, point.y, getScaledSize(context, POINT_RADIUS), 0, Math.PI * 2);
			context.fillStyle = isSelected ? SELECTED : POINT;
			context.fill();

			// label sits up and to the right of the dot, upright whatever the canvas flip is
			const offset = getScaledSize(context, LABEL_OFFSET);
			drawUprightText(
				context,
				String(index + 1),
				{ x: point.x + offset, y: point.y + offset },
				LABEL,
				LABEL_FONT_SIZE,
				PIVOT.CENTER
			);
		});

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
	}
}
