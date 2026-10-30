import type { HollowRectangleGeometry, RoundedHollowRectangleGeometry } from "../../../../interfaces/beams/RectSection.types";
import { getHollowRectangleRingLengths } from "../../../../solvers/polygonStrategies/HollowRectangleStrategy";
import { GenericBeamView, getScaledLineWidth } from "./GenericBeamView";

/**
 * Hollow rectangle. The polygon is the outer ring followed by the inner ring (see
 * HollowRectangleStrategy), so both rings go into one path and an even-odd fill leaves
 * the hole empty, without erasing what is drawn behind it.
 */
export class HollowRectangleBeam extends GenericBeamView<HollowRectangleGeometry | RoundedHollowRectangleGeometry> {

	override draw(props: { context: CanvasRenderingContext2D; isHovered?: boolean, isSelected?: boolean; }): void {
		this._recalculateAndCacheShapeData();

		const { context } = props;
		const points = this._cachedPathPoints;
		if (points.length === 0) {
			return;
		}

		const strokeStyle = context.strokeStyle;
		const fillStyle = context.fillStyle;
		const lineWidth = context.lineWidth;

		const { outer } = getHollowRectangleRingLengths(this._geometryConfig);

		context.beginPath();
		for (const ring of [points.slice(0, outer), points.slice(outer)]) {
			context.moveTo(ring[0].x, ring[0].y);
			for (let i = 1; i < ring.length; i++) {
				context.lineTo(ring[i].x, ring[i].y);
			}
			context.closePath();
		}

		context.fillStyle = this._geometryConfig.isNegative ?
			GenericBeamView.getNegativeAreaFillStyle(props) :
			GenericBeamView.getFillStyle(props);
		context.fill('evenodd');

		context.strokeStyle = 'black';
		context.lineWidth = getScaledLineWidth(context);
		context.stroke();

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
	}
}
