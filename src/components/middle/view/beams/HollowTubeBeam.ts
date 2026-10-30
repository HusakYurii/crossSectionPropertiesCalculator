import type { OSectionHollowGeometry } from "../../../../interfaces/beams/OSection.types";
import { GenericBeamView, getScaledLineWidth } from "./GenericBeamView";


/**
 * Hollow tube drawn as two true circles (not the polygon), filled even-odd so the hole stays empty.
 */
export class HollowTubeBeam extends GenericBeamView<OSectionHollowGeometry> {

	override draw(props: { context: CanvasRenderingContext2D; isHovered?: boolean, isSelected?: boolean; }): void {
		this._recalculateAndCacheShapeData();

		const D = this._geometryConfig.d1;
		const d = this._geometryConfig.d2;
		const { x: cx, y: cy } = this.position;

		const strokeStyle = props.context.strokeStyle;
		const fillStyle = props.context.fillStyle;
		const lineWidth = props.context.lineWidth;

		// both circles go into one path and an even-odd fill leaves the hole empty,
		// without erasing whatever is drawn behind it (grid, axes)
		props.context.beginPath();
		props.context.arc(cx, cy, D / 2, 0, Math.PI * 2);
		props.context.closePath();
		props.context.moveTo(cx + d / 2, cy);
		props.context.arc(cx, cy, d / 2, 0, Math.PI * 2);
		props.context.closePath();

		props.context.fillStyle = this._geometryConfig.isNegative ?
			GenericBeamView.getNegativeAreaFillStyle(props) :
			GenericBeamView.getFillStyle(props);
		props.context.fill('evenodd');

		props.context.strokeStyle = 'black';
		props.context.lineWidth = getScaledLineWidth(props.context);
		props.context.stroke();

		props.context.strokeStyle = strokeStyle;
		props.context.fillStyle = fillStyle;
		props.context.lineWidth = lineWidth;

	}
}
