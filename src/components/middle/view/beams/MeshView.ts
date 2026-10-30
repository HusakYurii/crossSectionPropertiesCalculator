import type { Detectable, Drawable, DrawTarget, Point } from "../../../../interfaces/common/types";
import type { Triangle } from "../../../../solvers/femTriangulator/triangulate";

export class MeshView implements DrawTarget {

	public uid = 'TBD';

	public showDebug: boolean = false;

	private _triangles: Triangle[];

	constructor(triangles: Triangle[]) {
		this._triangles = triangles;
	}

	contains(_point: Point): boolean {
		return false;
	}

	intersect(_polygon: Point[]): boolean {
		return false;
	}

	draw(props: { context: CanvasRenderingContext2D; }): void {
		const { context } = props;
		const strokeStyle = context.strokeStyle;
		const lineWidth = context.lineWidth;

		context.strokeStyle = 'rgba(0, 110, 255, 1)';
		context.lineWidth = 0.2;

		for (const [a, b, c] of this._triangles) {
			context.beginPath();
			context.moveTo(a.x, a.y);
			context.lineTo(b.x, b.y);
			context.lineTo(c.x, c.y);
			context.closePath();
			context.stroke();
		}

		context.strokeStyle = strokeStyle;
		context.lineWidth = lineWidth;
	}

	drawDebug(_props: { context: CanvasRenderingContext2D }): void {
	}

}
