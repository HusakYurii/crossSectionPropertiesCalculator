import type { DrawTarget, Point } from "../../../../interfaces/common/types";
import { getScaledSize } from "../canvas/drawUtils";
import { GRID } from "../../../../constants/canvasInteraction";
import { GRID_STYLE } from "../../../../constants/canvasStyle";

/**
 * Grid covering the whole visible canvas. Lines are laid out in world units,
 * so the grid pans and zooms together with the shapes, and only the lines
 * inside the current viewport are drawn.
 */
export class Grid implements DrawTarget {
	static uid = 'grid';

	public uid = Grid.uid;

	public showDebug: boolean = false;

	contains(_point: Point) {
		return false;
	}

	intersect(_polygon: Point[]): boolean {
		return false;
	}

	draw(props: { context: CanvasRenderingContext2D }) {
		const { context } = props;

		// visible world rect: invert the current transform for the canvas corners
		// (no rotation/skew here, so only scale a/d and translation e/f matter)
		const { a, d, e, f } = context.getTransform();
		const { width, height } = context.canvas;
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

		const strokeStyle = context.strokeStyle;
		const lineWidth = context.lineWidth;

		const firstX = Math.floor(minX / GRID.CELL_SIZE);
		const lastX = Math.ceil(maxX / GRID.CELL_SIZE);
		const firstY = Math.floor(minY / GRID.CELL_SIZE);
		const lastY = Math.ceil(maxY / GRID.CELL_SIZE);

		// minor lines first, then major ones on top so they are never covered
		for (const major of [false, true]) {
			context.strokeStyle = major ? GRID_STYLE.MAJOR_COLOR : GRID_STYLE.MINOR_COLOR;
			context.lineWidth = getScaledSize(context, major ? GRID_STYLE.MAJOR_LINE_WIDTH : GRID_STYLE.MINOR_LINE_WIDTH);

			context.beginPath();
			for (let i = firstX; i <= lastX; i++) {
				if ((i % GRID_STYLE.MAJOR_EVERY === 0) !== major) {
					continue;
				}
				const x = i * GRID.CELL_SIZE;
				context.moveTo(x, minY);
				context.lineTo(x, maxY);
			}
			for (let i = firstY; i <= lastY; i++) {
				if ((i % GRID_STYLE.MAJOR_EVERY === 0) !== major) {
					continue;
				}
				const y = i * GRID.CELL_SIZE;
				context.moveTo(minX, y);
				context.lineTo(maxX, y);
			}
			context.stroke();
		}

		context.strokeStyle = strokeStyle;
		context.lineWidth = lineWidth;
	}

	drawDebug(_props: { context: CanvasRenderingContext2D }): void {
	}
}
