import { degToRad } from "../../../../../mathUtils/anglesMath";
import type { Point } from "../../../../../interfaces/common/types";
import type { CrossSectionProperties } from "../../../../../interfaces/sectionProperties";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { AXIS_COLORS, PRINCIPAL_AXIS_COLORS } from "../constants/axisColors";
import { PreviewAxis } from "./PreviewAxis";
import { PreviewCentroid } from "./PreviewCentroid";
import { PreviewGyrationEllipse } from "./PreviewGyrationEllipse";
import { principalAxesDiffer } from "./principalAxes";

export type PropertyOverlaysOptions = {
	/**
	 * Draw a cross on the centroid. The shape preview leaves it out because the beam draws one at its
	 * origin; a canvas that draws a polygon where it is needs it.
	 */
	drawCentroid?: boolean;
};

export type PropertyOverlaysUpdate = {
	properties: CrossSectionProperties;
	/** angle of the shape's own x axis in radians; 0 for a shape that is drawn unrotated */
	shapeRotation?: number;
	/** the centroid, in the coordinates the canvas draws in; the world origin when left out */
	center?: Point;
};

/**
 * What a calculated shape shows on top of itself: its own x / y axes, the principal U / V axes when
 * they differ from those, the ellipse of gyration, and optionally the centroid. One class owns the
 * four so every canvas that shows a shape's properties draws them with the same colors, labels and rules.
 */
export class PropertyOverlays {
	/** in drawing order; add them all to a draw target */
	readonly targets: DrawableTarget[];

	private _shapeAxis: PreviewAxis;
	private _principalAxis: PreviewAxis;
	private _ellipse: PreviewGyrationEllipse;
	private _centroid: PreviewCentroid | null;

	constructor(options: PropertyOverlaysOptions = {}) {
		this._shapeAxis = new PreviewAxis({
			uid: 'overlay-axis',
			xLabel: 'x',
			yLabel: 'y',
			xColor: AXIS_COLORS.x,
			yColor: AXIS_COLORS.y,
		});
		// dash-dot pattern so they read as a different kind of axis than x / y
		this._principalAxis = new PreviewAxis({
			uid: 'overlay-principal-axis',
			xLabel: 'U',
			yLabel: 'V',
			xColor: PRINCIPAL_AXIS_COLORS.u,
			yColor: PRINCIPAL_AXIS_COLORS.v,
			dash: [10, 4, 2, 4],
		});
		this._ellipse = new PreviewGyrationEllipse();
		this._centroid = options.drawCentroid ? new PreviewCentroid() : null;

		this.targets = [this._shapeAxis, this._principalAxis, this._ellipse];
		if (this._centroid) {
			this.targets.push(this._centroid);
		}
	}

	update({ properties, shapeRotation = 0, center = { x: 0, y: 0 } }: PropertyOverlaysUpdate): void {
		this._shapeAxis.setCenter(center);
		this._shapeAxis.setRotation(shapeRotation);

		// principal axes: U is the max-inertia axis at theta_p (counterclockwise from world X), V is 90deg from it.
		// The solvers give the angle in degrees; the drawing maths is in radians.
		const thetaP = degToRad(properties.theta_p_deg);
		this._principalAxis.setCenter(center);
		this._principalAxis.setRotation(thetaP);
		// when they match the shape's own axes the two dashed pairs would overlap, so they only show when they differ
		this._principalAxis.setVisible(principalAxesDiffer(thetaP, shapeRotation));

		// ellipse of gyration: the radius about U is laid off along V and the radius about V along U (see the class)
		this._ellipse.setEllipse({ semiAxisU: properties.r_v, semiAxisV: properties.r_u, rotation: thetaP, center });

		this._centroid?.setCenter(center);
	}
}
