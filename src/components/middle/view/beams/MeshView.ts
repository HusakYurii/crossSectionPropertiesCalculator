import type { DrawTarget, Point } from "../../../../interfaces/common/types";
import type { Triangle } from "../../../../solvers/femTriangulator/triangulate";
import { getScaledSize } from "../canvas/drawUtils";
import { MESH_STYLE } from "../../../../constants/canvasStyle";

export class MeshView implements DrawTarget {

	public uid = 'TBD';

	public showDebug: boolean = false;

	private _triangles: Triangle[];
	private _screenLineWidth?: number;

	/** `screenLineWidth` keeps the lines one width at any zoom; without it they are MESH_STYLE.LINE_WIDTH in world units */
	constructor(triangles: Triangle[], options: { screenLineWidth?: number } = {}) {
		this._triangles = triangles;
		this._screenLineWidth = options.screenLineWidth;
	}

	contains(_point: Point): boolean {
		return false;
	}

	draw(props: { context: CanvasRenderingContext2D; }): void {
		const { context } = props;
		const strokeStyle = context.strokeStyle;
		const lineWidth = context.lineWidth;
		const lineJoin = context.lineJoin;

		context.strokeStyle = MESH_STYLE.STROKE;
		context.lineWidth = this._screenLineWidth === undefined ? MESH_STYLE.LINE_WIDTH : getScaledSize(context, this._screenLineWidth);
		context.lineJoin = 'round';

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
		context.lineJoin = lineJoin;
	}

	drawDebug(_props: { context: CanvasRenderingContext2D }): void {
	}

}
