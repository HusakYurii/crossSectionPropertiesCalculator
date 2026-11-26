import type { Point } from "@/shared/types/geometry";
import { PIVOT, drawUprightText, getScaledSize, type DrawableTarget } from "@/shared/canvas";
import { CANVAS_FONT } from '@/shared/canvas/canvasStyle';
import { POLYGON_EDITOR_STYLE } from '../constants';

/**
 * Draws the polygon being edited: filled once it has 3 points, an open line before that,
 * then every vertex as a dot with its list number next to it.
 */
export class PolygonDrawTarget implements DrawableTarget {
	public readonly uid = 'custom-polygon';

	private _getPoints: () => Point[];
	private _getSelectedIndices: () => number[];
	private _getSelectionBox: () => { min: Point; max: Point } | null;

	constructor(getPoints: () => Point[], getSelectedIndices: () => number[], getSelectionBox: () => { min: Point; max: Point } | null = () => null) {
		this._getPoints = getPoints;
		this._getSelectedIndices = getSelectedIndices;
		this._getSelectionBox = getSelectionBox;
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

		context.lineWidth = getScaledSize(context, POLYGON_EDITOR_STYLE.LINE_WIDTH);
		context.strokeStyle = POLYGON_EDITOR_STYLE.STROKE;

		if (points.length >= 2) {
			context.beginPath();
			context.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				context.lineTo(points[i].x, points[i].y);
			}
			if (points.length >= 3) {
				context.closePath();
				context.fillStyle = POLYGON_EDITOR_STYLE.FILL;
				context.fill();
			}
			context.stroke();
		}

		const selected = this._getSelectedIndices();
		points.forEach((point, index) => {
			const isSelected = selected.includes(index);

			if (isSelected) {
				context.beginPath();
				context.arc(point.x, point.y, getScaledSize(context, POLYGON_EDITOR_STYLE.POINT_RADIUS + POLYGON_EDITOR_STYLE.SELECTED_RING), 0, Math.PI * 2);
				context.fillStyle = POLYGON_EDITOR_STYLE.SELECTED_FILL;
				context.fill();
			}

			context.beginPath();
			context.arc(point.x, point.y, getScaledSize(context, POLYGON_EDITOR_STYLE.POINT_RADIUS), 0, Math.PI * 2);
			context.fillStyle = isSelected ? POLYGON_EDITOR_STYLE.SELECTED : POLYGON_EDITOR_STYLE.POINT;
			context.fill();

			// label sits up and to the right of the dot, upright whatever the canvas flip is
			const offset = getScaledSize(context, POLYGON_EDITOR_STYLE.LABEL_OFFSET);
			drawUprightText(
				context,
				String(index + 1),
				{ x: point.x + offset, y: point.y + offset },
				POLYGON_EDITOR_STYLE.LABEL,
				CANVAS_FONT.LABEL_SIZE,
				PIVOT.CENTER
			);
		});

		// last, so the box lies over the polygon
		const box = this._getSelectionBox();
		if (box) {
			context.lineWidth = getScaledSize(context, POLYGON_EDITOR_STYLE.LINE_WIDTH / 2);
			context.strokeStyle = POLYGON_EDITOR_STYLE.SELECTION_BOX_STROKE;
			context.fillStyle = POLYGON_EDITOR_STYLE.SELECTION_BOX_FILL;
			context.setLineDash(POLYGON_EDITOR_STYLE.SELECTION_BOX_DASH.map((length) => getScaledSize(context, length)));
			context.beginPath();
			context.rect(box.min.x, box.min.y, box.max.x - box.min.x, box.max.y - box.min.y);
			context.fill();
			context.stroke();
			context.setLineDash([]);
		}

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
	}
}
