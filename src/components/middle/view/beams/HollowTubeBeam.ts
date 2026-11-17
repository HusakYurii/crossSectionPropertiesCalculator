import type { OSectionHollowGeometry } from "../../../../interfaces/beams/OSection.types";
import type { BoundingBox } from "../../../../interfaces/common/types";
import { GenericBeamView } from "./GenericBeamView";


/**
 * Hollow tube drawn as two true circles (not the polygon), filled even-odd so the hole stays empty.
 */
export class HollowTubeBeam extends GenericBeamView<OSectionHollowGeometry> {

	protected override _fillRule: CanvasFillRule = 'evenodd';

	protected override _buildPath(): Path2D {
		const D = this._geometryConfig.d1;
		const d = this._geometryConfig.d2;
		const { x: cx, y: cy } = this.position;

		// both circles go into one path and an even-odd fill leaves the hole empty,
		// without erasing whatever is drawn behind it (grid, axes)
		const path = new Path2D();
		path.arc(cx, cy, D / 2, 0, Math.PI * 2);
		path.closePath();
		path.moveTo(cx + d / 2, cy);
		path.arc(cx, cy, d / 2, 0, Math.PI * 2);
		path.closePath();
		return path;
	}

	// the polygon can be shorter than the true circle, so the hatch covers the circle's box instead
	protected override _getHatchBounds(): BoundingBox {
		const D = this._geometryConfig.d1;
		const { x: cx, y: cy } = this.position;
		return { x: cx - D / 2, y: cy - D / 2, width: D, height: D };
	}

	// a circle is as wide across the hatch lines as it is in any direction
	protected override _getHatchExtent(): number {
		return this._geometryConfig.d1;
	}
}
