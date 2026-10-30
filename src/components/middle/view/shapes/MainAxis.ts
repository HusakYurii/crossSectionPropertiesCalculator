import type { DrawTarget } from "../../../../interfaces/common/types";
import type { Point } from "../../../../interfaces/common/types";
import { getScaledLineWidth } from "../beams";
import { AXIS_COLORS } from "../canvas/constants/axisColors";

/**
 * X and Y axes through the world origin, drawn across the whole visible
 * canvas so they look infinite at any pan or zoom.
 */
export class MainAxis implements DrawTarget {
	static uid = 'mainAxis';

	public uid = MainAxis.uid;

	public showDebug: boolean = false;

	contains(_point: Point) {
		return false
	}

	intersect(_polygon: Point[]): boolean {
		return false;
	}

	draw(props: { context: CanvasRenderingContext2D; }) {

		const strokeStyle = props.context.strokeStyle;
		const fillStyle = props.context.fillStyle;
		const lineWidth = props.context.lineWidth;

		// visible world rect: invert the current transform for the canvas corners
		// (no rotation/skew here, so only scale a/d and translation e/f matter)
		const { a, d, e, f } = props.context.getTransform();
		const { width, height } = props.context.canvas;
		if (!a || !d) {
			return;
		}

		const worldX1 = (0 - e) / a;
		const worldX2 = (width - e) / a;
		const worldY1 = (0 - f) / d;
		const worldY2 = (height - f) / d;

		const minX = Math.min(worldX1, worldX2);
		const maxX = Math.max(worldX1, worldX2);
		const minY = Math.min(worldY1, worldY2);
		const maxY = Math.max(worldY1, worldY2);

		props.context.lineWidth = getScaledLineWidth(props.context);

		props.context.strokeStyle = AXIS_COLORS.x;
		props.context.beginPath();
		props.context.moveTo(minX, 0);
		props.context.lineTo(maxX, 0);
		props.context.stroke();

		props.context.strokeStyle = AXIS_COLORS.y;
		props.context.beginPath();
		props.context.moveTo(0, minY);
		props.context.lineTo(0, maxY);
		props.context.stroke();

		props.context.strokeStyle = strokeStyle;
		props.context.fillStyle = fillStyle;
		props.context.lineWidth = lineWidth;

	}

	drawDebug(_props: { context: CanvasRenderingContext2D }): void {
	}

}
