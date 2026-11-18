import type { BoundingBox, DrawTarget } from "../../../../interfaces/common/types";
import type { Point } from "../../../../interfaces/common/types";
import { isPointInPolygon } from "../../../../solvers/poligonUtils/polygonIntersectionMath";
import type { Geometry } from "../../../../interfaces/beams/common.types";
import type { Store } from "../../../../store/store";
import { drawOriginCross, getScaledSize } from "../canvas/drawUtils";
import { CrossHatch } from "../canvas/CrossHatch";
import { BEAM_STYLE, ORIGIN_CROSS_STYLE } from "../../../../constants/canvasStyle";

export { getScaledSize } from "../canvas/drawUtils";

/**
 * lineWidth is in world units, so a fixed value gets thicker/thinner on screen
 * as zoom changes (e.g. a small shape fit-scaled way up). Deriving it from the
 * current transform's scale keeps the stroke a constant screen-pixel width.
 */
export function getScaledLineWidth(context: CanvasRenderingContext2D): number {
	return getScaledSize(context, BEAM_STYLE.LINE_WIDTH);
}

export interface GenericBeamViewParams {
	uid: string;
	store: Store;
	// we take all we need tom
}

export class GenericBeamView<G extends Geometry = Geometry> implements DrawTarget {

	public showDebug: boolean = false;
	// positive shapes are hatched; a view can turn it off for good (e.g. the form preview)
	public showHatching: boolean = true;
	public uid: string;

	protected _store: Store;

	/**
	 * This one derives from this._geometryPolygon and takes into account the
	 * shape calculated centroid from CrossSectionProperties, this._geometryConfig.rotation and this._position
	 * to properly draw the shape on the screen
	 */
	protected _cachedPathPoints: Point[];
	protected _cachedBoundingBox: BoundingBox;

	/** how the path is filled and clipped: even-odd leaves the holes of the hollow shapes empty */
	protected _fillRule: CanvasFillRule = 'nonzero';

	private static _crossHatch = new CrossHatch();

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

	get boundingBox() {
		return this._cachedBoundingBox;
	}

	draw(props: { context: CanvasRenderingContext2D; isHovered?: boolean, isSelected?: boolean; showHatching?: boolean }): void {
		this._recalculateAndCacheShapeData();
		if (this._cachedPathPoints.length === 0) {
			return;
		}

		const { context } = props;
		// one Path2D for fill, clip and stroke: save()/restore() do not keep the context's current path
		const path = this._buildPath();

		context.save();

		context.fillStyle = this.isNegative ?
			GenericBeamView.getNegativeAreaFillStyle(props) :
			GenericBeamView.getFillStyle(props);
		context.fill(path, this._fillRule);

		if (!this.isNegative && this.showHatching && (props.showHatching ?? true)) {
			GenericBeamView._crossHatch.draw(context, {
				path,
				fillRule: this._fillRule,
				bounds: this._getHatchBounds(),
				size: this._getHatchSize(),
				// given once when the shape was created; shapes of old projects get one on load
				direction: this._geometryConfig.hatchAngle ?? 45,
				anchor: this.position,
			});
		}

		context.strokeStyle = 'black';
		context.lineWidth = getScaledLineWidth(context);
		context.stroke(path);

		context.restore();

		drawOriginCross(context, this.position, ORIGIN_CROSS_STYLE.COLOR, ORIGIN_CROSS_STYLE.SIZE, ORIGIN_CROSS_STYLE.LINE_WIDTH);
	}

	/** The outline of the shape. Subclasses override it (with _fillRule) when it is not the polygon of _cachedPathPoints. */
	protected _buildPath(): Path2D {
		const path = new Path2D();
		path.moveTo(this._cachedPathPoints[0].x, this._cachedPathPoints[0].y);
		for (let i = 1; i < this._cachedPathPoints.length; i++) {
			path.lineTo(this._cachedPathPoints[i].x, this._cachedPathPoints[i].y);
		}
		path.closePath();
		return path;
	}

	/** The area the cross-hatch has to cover. */
	protected _getHatchBounds(): BoundingBox {
		return this._cachedBoundingBox;
	}

	/** Characteristic size of the shape, sqrt of its net area, in world units. The hatch spacing scales with it. */
	protected _getHatchSize(): number {
		const area = this._store.crossSectionProperties[this.uid]?.A;
		if (area !== undefined && Number.isFinite(area) && area !== 0) {
			return Math.sqrt(Math.abs(area));
		}
		const bbox = this._getHatchBounds();
		return Math.sqrt(bbox.width * bbox.height);
	}

	drawDebug(props: { context: CanvasRenderingContext2D }): void {
		const { x, y, width, height } = this._cachedBoundingBox;
		const strokeStyle = props.context.strokeStyle;
		const lineWidth = props.context.lineWidth;

		props.context.strokeStyle = BEAM_STYLE.DEBUG_STROKE;
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
		return props.isSelected ? BEAM_STYLE.FILL.SELECTED :
			props.isHovered ? BEAM_STYLE.FILL.HOVER : BEAM_STYLE.FILL.NONE;
	}

	static getNegativeAreaFillStyle = (props: {
		isSelected?: boolean;
		isHovered?: boolean;
	}) => {
		return props.isSelected ? BEAM_STYLE.NEGATIVE_FILL.SELECTED :
			props.isHovered ? BEAM_STYLE.NEGATIVE_FILL.HOVER : BEAM_STYLE.NEGATIVE_FILL.NONE;
	}

}
