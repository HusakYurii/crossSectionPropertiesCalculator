import type { DrawTarget, Point } from "../../../../interfaces/common/types";
import { getScaledSize } from "../canvas/drawUtils";
import { GRID_CELL_SIZE } from "../canvas/gridSnap";

// every MAJOR_EVERY-th line is drawn thicker/darker, forming MAJOR_EVERY x MAJOR_EVERY cells
const MAJOR_EVERY = 10;
const MINOR_LINE_WIDTH = 1.5;
const MAJOR_LINE_WIDTH = 2.5;
const MINOR_COLOR = '#e2e2e2';
const MAJOR_COLOR = '#c8c8c8';

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

		const firstX = Math.floor(minX / GRID_CELL_SIZE);
		const lastX = Math.ceil(maxX / GRID_CELL_SIZE);
		const firstY = Math.floor(minY / GRID_CELL_SIZE);
		const lastY = Math.ceil(maxY / GRID_CELL_SIZE);

		// minor lines first, then major ones on top so they are never covered
		for (const major of [false, true]) {
			context.strokeStyle = major ? MAJOR_COLOR : MINOR_COLOR;
			context.lineWidth = getScaledSize(context, major ? MAJOR_LINE_WIDTH : MINOR_LINE_WIDTH);

			context.beginPath();
			for (let i = firstX; i <= lastX; i++) {
				if ((i % MAJOR_EVERY === 0) !== major) {
					continue;
				}
				const x = i * GRID_CELL_SIZE;
				context.moveTo(x, minY);
				context.lineTo(x, maxY);
			}
			for (let i = firstY; i <= lastY; i++) {
				if ((i % MAJOR_EVERY === 0) !== major) {
					continue;
				}
				const y = i * GRID_CELL_SIZE;
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
