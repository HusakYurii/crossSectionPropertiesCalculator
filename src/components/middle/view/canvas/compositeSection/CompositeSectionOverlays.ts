import type { CrossSectionProperties } from "../../../../../interfaces/sectionProperties";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { DimensionsWithTextLabel } from "../annotations/DimensionsWithTextLabel";
import { CompositeCentroidDimensionSource } from "../annotations/dimensionSources/CompositeCentroidDimensionSource";
import { appSessionState } from "../../../../../store/store";
import { AXIS_STYLE, CANVAS_FONT, CENTROID_STYLE } from "../../../../../constants/canvasStyle";
import { PropertyOverlays } from "../propertiesHelperPreviews";
import { anyQuickSolverToggleOn, type QuickSolverToggles } from "../../../../../interfaces/quickSolverToggles";

// the section's own marks are easier to read than a shape's: the centroid cross is twice as heavy as an axis line and 30% bigger
const CENTROID_LINE_WIDTH = 2 * AXIS_STYLE.LINE_WIDTH;
const CENTROID_SIZE = 1.3 * CENTROID_STYLE.CROSS_SIZE;

/**
 * What the whole built-up section shows on the main canvas: its centroid cross, the principal axes and the
 * gyration ellipse about the centroid, and the labels of the centroid coordinates. It only draws what it is given
 * in `update`; solving is done elsewhere.
 *
 * The labels are not drawn here: the canvas draws them with the other labels, so `labels` says which are visible.
 */
export class CompositeSectionOverlays implements DrawableTarget {
	public readonly uid = 'composite-section-overlays';

	private _overlays: PropertyOverlays;
	private _source = new CompositeCentroidDimensionSource(appSessionState);
	private _labels: DimensionsWithTextLabel[];
	private _visible = false;
	private _showLabels = false;

	constructor() {
		// the x / y axes of a single shape mean nothing here
		this._overlays = new PropertyOverlays({
			drawCentroid: true,
			layers: { shapeAxes: false },
			style: { labelFontSize: CANVAS_FONT.LABEL_SIZE, centroidLineWidth: CENTROID_LINE_WIDTH, centroidSize: CENTROID_SIZE },
		});
		this._labels = (['x', 'y'] as const).map((axis) => new DimensionsWithTextLabel({
			uid: `section-centroid_${axis}`,
			axis,
			labelPrefix: axis === 'x' ? 'Cx: ' : 'Cy: ',
			color: AXIS_STYLE.COLORS[axis],
			source: this._source,
			editable: false,
		}));
	}

	/** the two coordinate labels while they are shown, else none */
	get labels(): DimensionsWithTextLabel[] {
		return this._showLabels ? this._labels : [];
	}

	/** null properties (no result) or all toggles off hides everything */
	update(properties: CrossSectionProperties | null, toggles: QuickSolverToggles): void {
		const anyOn = anyQuickSolverToggleOn(toggles);
		this._visible = properties !== null && anyOn;
		this._showLabels = this._visible && toggles.centroid;

		if (!properties || !anyOn) {
			this._source.setPosition(undefined);
			return;
		}

		const center = { x: properties.centroid_x, y: properties.centroid_y };
		// the cross shows whenever anything is on, as everything else is centered on it
		this._overlays.update({
			properties,
			center,
			layers: { centroid: true, principalAxes: toggles.principalAxes, principalAngle: toggles.principalAxes, gyrationEllipse: toggles.gyration },
		});
		this._source.setPosition(center);
	}

	draw(props: { context: CanvasRenderingContext2D }): void {
		if (!this._visible) {
			return;
		}

		this._overlays.targets.forEach((target) => target.draw(props));
	}
}
