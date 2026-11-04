import type { BoundingBox, DrawTarget } from "../../../../interfaces/common/types";
import type { Point } from "../../../../interfaces/common/types";
import { isPointInPolygon, doPolygonsIntersect } from "../../../../solvers/poligonUtils/polygonIntersectionMath";
import type { Geometry } from "../../../../interfaces/beams/common.types";
import type { Store } from "../../../../store/store";
import { drawOriginCross, getScaledSize } from "../canvas/drawUtils";

export { getScaledSize } from "../canvas/drawUtils";

const SCREEN_LINE_WIDTH = 2.7;
const ORIGIN_CROSS_SIZE = 6;

/**
 * lineWidth is in world units, so a fixed value gets thicker/thinner on screen
 * as zoom changes (e.g. a small shape fit-scaled way up). Deriving it from the
 * current transform's scale keeps the stroke a constant screen-pixel width.
 */
export function getScaledLineWidth(context: CanvasRenderingContext2D): number {
	return getScaledSize(context, SCREEN_LINE_WIDTH);
}

export interface GenericBeamViewParams {
	uid: string;
	store: Store;
	// we take all we need tom
}

const FILL_STYLE = {
	HOVER: "rgb(196 236 254)",
	SELECTED: "rgb(72 183 255)",
	NONE: "#ffffff"
}

const NEGATIVE_FILL_STYLE = {
	HOVER: "#fcbba1",
	SELECTED: "#fc9272",
	NONE: "#ffffff"
}

export class GenericBeamView<G extends Geometry = Geometry> implements DrawTarget {

	public showDebug: boolean = false;
	public uid: string;

	protected _store: Store;

	/**
	 * This one derives from this._geometryPolygon and takes into account the
	 * shape calculated centroid from CrossSectionProperties, this._geometryConfig.rotation and this._position
	 * to properly draw the shape on the screen
	 */
	protected _cachedPathPoints: Point[];
	protected _cachedBoundingBox: BoundingBox;

	constructor(params: GenericBeamViewParams) {
		this.uid = params.uid;
		this._store = params.store;

		this._cachedPathPoints = [];
		this._cachedBoundingBox = { x: 0, y: 0, width: 1, height: 1 };
	}

	/**
	 * This getter works safer because of history feature.
	 * Read from the store on every access: undo/redo can replace the stored object, 
	 * so we want to avoid local references in constructor because those would go stale
	 */
	protected get _geometryConfig(): G {
		return this._store.geometry[this.uid] as G;
	}

	get isNegative() {
		return this._geometryConfig.isNegative;
	}

	get position() {
		return this._store.geometryExtra[this.uid].position
	}

	get pathPoints() {
		return this._cachedPathPoints;
	}


	draw(props: { context: CanvasRenderingContext2D; isHovered?: boolean, isSelected?: boolean; }): void {
		this._recalculateAndCacheShapeData();

		const strokeStyle = props.context.strokeStyle;
		const fillStyle = props.context.fillStyle;
		const lineWidth = props.context.lineWidth;

		props.context.beginPath();
		props.context.moveTo(this._cachedPathPoints[0].x, this._cachedPathPoints[0].y);

		for (let i = 1; i < this._cachedPathPoints.length; i++) {
			props.context.lineTo(this._cachedPathPoints[i].x, this._cachedPathPoints[i].y);

		}

		props.context.closePath();

		props.context.fillStyle = this._geometryConfig.isNegative ?
			GenericBeamView.getNegativeAreaFillStyle(props) :
			GenericBeamView.getFillStyle(props);

		props.context.fill();

		props.context.strokeStyle = 'black';
		props.context.lineWidth = getScaledLineWidth(props.context);

		props.context.stroke();


		props.context.strokeStyle = strokeStyle;
		props.context.fillStyle = fillStyle;
		props.context.lineWidth = lineWidth;

		drawOriginCross(props.context, this.position, 'rgba(0, 0, 0, 0.6)', ORIGIN_CROSS_SIZE, SCREEN_LINE_WIDTH);
	}

	drawDebug(props: { context: CanvasRenderingContext2D }): void {
		const { x, y, width, height } = this._cachedBoundingBox;
		const strokeStyle = props.context.strokeStyle;
		const lineWidth = props.context.lineWidth;

		props.context.strokeStyle = 'rgba(59, 0, 253, 1)';
		props.context.lineWidth = 1;
		props.context.strokeRect(x, y, width, height);

		props.context.strokeStyle = strokeStyle;
		props.context.lineWidth = lineWidth;
	}

	setPosition(point: Point) {
		this._store.geometryExtra[this.uid].position.x = point.x;
		this._store.geometryExtra[this.uid].position.y = point.y;
	}

	setRotation(rotation: number) {
		this._geometryConfig.rotation = rotation;
	}

	contains(point: Point): boolean {
		return isPointInPolygon(point, this._cachedPathPoints);
	}

	intersect(polygon: Point[]): boolean {
		return doPolygonsIntersect(this._cachedPathPoints, polygon);
	}

	getPathPointsAtPosition(position: Point): Point[] {
		const dx = position.x - this.position.x;
		const dy = position.y - this.position.y;

		return this._cachedPathPoints.map((point) => ({
			x: point.x + dx,
			y: point.y + dy,
		}));
	}

	protected _centerPathPoints(): void {

		const { x: cx, y: cy } = this.position;
		const { centroid_x, centroid_y } = this._store.crossSectionProperties[this.uid];
		this._cachedPathPoints = this._store.crossSectionPolygon[this.uid].map(({ x, y }) => {
			return {
				x: x - centroid_x + cx,
				y: y - centroid_y + cy
			}
		})
	}

	private _recalculateBoundingBox() {
		if (this._cachedPathPoints.length === 0) {
			this._cachedBoundingBox = {
				x: this.position.x,
				y: this.position.y,
				width: 0,
				height: 0,
			};
			return;
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const { x, y } of this._cachedPathPoints) {
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}

		this._cachedBoundingBox = {
			x: minX,
			y: minY,
			width: maxX - minX,
			height: maxY - minY,
		};
	}

	protected _recalculateAndCacheShapeData() {
		this._centerPathPoints();
		this._recalculateBoundingBox();
	}


	static getFillStyle = (props: {
		isSelected?: boolean;
		isHovered?: boolean;
	}) => {
		return props.isSelected ? FILL_STYLE.SELECTED :
			props.isHovered ? FILL_STYLE.HOVER : FILL_STYLE.NONE;
	}

	static getNegativeAreaFillStyle = (props: {
		isSelected?: boolean;
		isHovered?: boolean;
	}) => {
		return props.isSelected ? NEGATIVE_FILL_STYLE.SELECTED :
			props.isHovered ? NEGATIVE_FILL_STYLE.HOVER : NEGATIVE_FILL_STYLE.NONE;
	}

}
