import { degToRad } from "../../../../../mathUtils/anglesMath";
import type { Point } from "../../../../../interfaces/common/types";
import type { CrossSectionProperties } from "../../../../../interfaces/sectionProperties";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { AXIS_STYLE } from "../../../../../constants/canvasStyle";
import { PreviewAxis } from "./PreviewAxis";
import { PreviewCentroid } from "./PreviewCentroid";
import { PreviewGyrationEllipse } from "./PreviewGyrationEllipse";
import { PreviewPrincipalAngle } from "./PreviewPrincipalAngle";
import { principalAxesDiffer } from "./principalAxes";

/** which parts are drawn; a part left out keeps its current setting */
export type PropertyOverlayLayers = {
	/** the shape's own x / y axes */
	shapeAxes: boolean;
	/** the principal U / V axes (still hidden when they match the shape axes that are drawn) */
	principalAxes: boolean;
	gyrationEllipse: boolean;
	/** the cross on the centroid; only has an effect when `drawCentroid` is on */
	centroid: boolean;
	/** the arc and the text of the principal axes' rotation; off when left out, and hidden together with the principal axes */
	principalAngle: boolean;
};

export type PropertyOverlaysOptions = {
	/**
	 * Draw a cross on the centroid. The shape preview leaves it out because the beam draws one at its
	 * origin; a canvas that draws a polygon where it is needs it.
	 */
	drawCentroid?: boolean;
	/** everything is on when left out */
	layers?: Partial<PropertyOverlayLayers>;
	/** sizes of single parts; each keeps its own default when left out */
	style?: {
		/** font size of the axis labels (x / y, U / V) and of the principal angle text, in screen px */
		labelFontSize?: number;
		/** line width of the centroid cross, in screen px */
		centroidLineWidth?: number;
		/** size of the centroid cross, in screen px */
		centroidSize?: number;
	};
};

export type PropertyOverlaysUpdate = {
	properties: CrossSectionProperties;
	/** angle of the shape's own x axis in radians; 0 for a shape that is drawn unrotated */
	shapeRotation?: number;
	/** the centroid, in the coordinates the canvas draws in; the world origin when left out */
	center?: Point;
	/** parts to show or hide together with this update; the others keep their setting */
	layers?: Partial<PropertyOverlayLayers>;
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
	private _principalAngle: PreviewPrincipalAngle;
	private _centroid: PreviewCentroid | null;
	private _layers: PropertyOverlayLayers;
	private _last: PropertyOverlaysUpdate | null = null;

	constructor(options: PropertyOverlaysOptions = {}) {
		this._shapeAxis = new PreviewAxis({
			uid: 'overlay-axis',
			xLabel: 'x',
			yLabel: 'y',
			xColor: AXIS_STYLE.COLORS.x,
			yColor: AXIS_STYLE.COLORS.y,
			labelFontSize: options.style?.labelFontSize,
		});
		// dash-dot pattern so they read as a different kind of axis than x / y
		this._principalAxis = new PreviewAxis({
			uid: 'overlay-principal-axis',
			xLabel: 'U',
			yLabel: 'V',
			xColor: AXIS_STYLE.PRINCIPAL_COLORS.u,
			yColor: AXIS_STYLE.PRINCIPAL_COLORS.v,
			dash: [10, 4, 2, 4],
			labelFontSize: options.style?.labelFontSize,
		});
		this._ellipse = new PreviewGyrationEllipse();
		this._centroid = options.drawCentroid
			? new PreviewCentroid({ lineWidth: options.style?.centroidLineWidth, size: options.style?.centroidSize })
			: null;
		this._principalAngle = new PreviewPrincipalAngle({ fontSize: options.style?.labelFontSize });

		this._layers = { shapeAxes: true, principalAxes: true, gyrationEllipse: true, centroid: true, principalAngle: false, ...options.layers };

		this.targets = [this._shapeAxis, this._principalAxis, this._ellipse, this._principalAngle];
		if (this._centroid) {
			this.targets.push(this._centroid);
		}
	}

	/** shows or hides single parts; applies at once, no new `update` needed */
	setLayers(layers: Partial<PropertyOverlayLayers>): void {
		this._layers = { ...this._layers, ...layers };
		if (this._last) {
			this.update(this._last);
		} else {
			this._applyLayers();
		}
	}

	update(data: PropertyOverlaysUpdate): void {
		this._last = data;
		const { properties, shapeRotation = 0, center = { x: 0, y: 0 } } = data;
		if (data.layers) {
			this._layers = { ...this._layers, ...data.layers };
		}
		this._shapeAxis.setCenter(center);
		this._shapeAxis.setRotation(shapeRotation);

		// principal axes: U is the max-inertia axis at theta_p (counterclockwise from world X), V is 90deg from it.
		// The solvers give the angle in degrees; the drawing maths is in radians.
		const thetaP = degToRad(properties.theta_p_deg);
		this._principalAxis.setCenter(center);
		this._principalAxis.setRotation(thetaP);
		// when they match the shape's own axes the two dashed pairs would overlap, so they only show when they differ
		// (if the shape's axes are not drawn there is nothing to overlap, so a symmetric section still shows U / V)
		const principalVisible = this._layers.principalAxes && (!this._layers.shapeAxes || principalAxesDiffer(thetaP, shapeRotation));
		this._principalAxis.setVisible(principalVisible);
		// the angle goes with the axes it belongs to
		this._principalAngle.setAngle({ center, rotation: thetaP });
		this._principalAngle.setVisible(this._layers.principalAngle && principalVisible);

		// ellipse of gyration: the radius about U is laid off along V and the radius about V along U (see the class)
		this._ellipse.setEllipse({ semiAxisU: properties.r_v, semiAxisV: properties.r_u, rotation: thetaP, center });

		this._centroid?.setCenter(center);
		this._applyLayers();
	}

	// the parts that do not depend on the numbers of an update
	private _applyLayers(): void {
		this._shapeAxis.setVisible(this._layers.shapeAxes);
		this._ellipse.setVisible(this._layers.gyrationEllipse);
		this._centroid?.setVisible(this._layers.centroid);
		if (!this._last) {
			this._principalAxis.setVisible(false);
			this._principalAngle.setVisible(false);
		}
	}
}
