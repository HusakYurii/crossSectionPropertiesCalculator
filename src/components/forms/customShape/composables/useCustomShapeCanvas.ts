import { onMounted, onUnmounted, watch, type Ref } from 'vue';
import type { CanvasSize } from '../../../middle/view/canvas/Canvas.ts';
import { CanvasScene } from '../../../middle/view/canvas/CanvasScene.ts';
import { CURSOR } from '../../../../constants/canvasInteraction.ts';
import { AXIS_STYLE, CANVAS_FONT } from '../../../../constants/canvasStyle.ts';
import { CUSTOM_SHAPE_EDITOR_VIEW } from '../../../../constants/canvasFit.ts';
import { DrawTargetsCollection, type DrawableTarget } from '../../../middle/view/canvas/DrawTargetsCollection.ts';
import { Grid, MainAxis, ScaleBar } from '../../../middle/view/shapes/index.ts';
import { MeshView } from '../../../middle/view/beams/index.ts';
import { PropertyOverlays } from '../../../middle/view/canvas/propertiesHelperPreviews/index.ts';
import type { Point } from '../../../../interfaces/common/types.ts';
import type { CrossSectionProperties } from '../../../../interfaces/sectionProperties/index.ts';
import type { Triangle } from '../../../../solvers/femTriangulator/triangulate.ts';
import { PolygonDrawTarget } from '.././drawUtils/PolygonDrawTarget.ts';
import { PolygonEditor } from '.././drawUtils/PolygonEditor.ts';

type CustomShapeCanvasProps = {
	canvasRef: Ref<HTMLCanvasElement | null>;
	wrapperRef: Ref<HTMLDivElement | null>;
	points: () => Point[];
	selectedIndices: Ref<number[]>;
	crossSectionProperties: Ref<CrossSectionProperties>;
	crossSectionMesh: Ref<Triangle[]>;
	isStale: Ref<boolean>;
	hasResults: Ref<boolean>;
	/** the snap step in mm, or null while snapping is off */
	getSnapStep: () => number | null;
};

/** the editor canvas: grid, polygon with its point editing, and the mesh and overlays of the results */
export function useCustomShapeCanvas(props: CustomShapeCanvasProps) {
	const { canvasRef, wrapperRef, points, selectedIndices, crossSectionProperties, crossSectionMesh, isStale, hasResults, getSnapStep } = props;

	let scene: CanvasScene | undefined;
	// the view is fitted to an existing shape once, the first time the canvas has a size
	let hasFitted = false;

	let gridTargets: DrawTargetsCollection<Grid>;
	let axisTargets: DrawTargetsCollection<MainAxis>;
	let meshTargets: DrawTargetsCollection<MeshView>;
	let polygonTargets: DrawTargetsCollection<PolygonDrawTarget>;
	let overlayTargets: DrawTargetsCollection<DrawableTarget>;
	let scaleBarTargets: DrawTargetsCollection<ScaleBar>;

	// The polygon is drawn where the points are, so the centroid is not the world origin and every overlay is
	// centered on it. The shape is never rotated, so its own axes are the world axes.
	const overlays = new PropertyOverlays({ drawCentroid: true, style: { labelFontSize: CANVAS_FONT.LABEL_SIZE, labelTopReserve: AXIS_STYLE.LABEL_TOP_RESERVE } });

	function syncOverlays() {
		const { centroid_x, centroid_y } = crossSectionProperties.value;
		overlays.update({ properties: crossSectionProperties.value, center: { x: centroid_x, y: centroid_y } });
	}

	const redraw = () => {
		gridTargets.draw();
		axisTargets.draw();
		// the mesh belongs to the polygon it was calculated from, so it is hidden once that has changed
		if (!isStale.value) {
			meshTargets.draw();
		}
		polygonTargets.draw();
		// over the shape, like in the shape preview, so the centroid and the axes stay visible
		if (hasResults.value) {
			overlayTargets.draw();
		}
		// last, so nothing covers it
		scaleBarTargets.draw();
	};

	const requestRedraw = () => scene?.requestRedraw();

	/** the polygon is never rotated, so the mesh lies on the drawn points as the solver returned it */
	function showMesh(triangles: Triangle[]) {
		meshTargets.cleanUp();
		if (triangles.length > 0) {
			meshTargets.add(new MeshView(triangles));
		}
	}

	/**
	 * Zooms and pans so the drawn points fill the canvas, like the shape preview does. It is meant for
	 * a shape that is opened for editing; a new shape has no points and keeps the start view.
	 */
	function fitViewToPoints(size: CanvasSize) {
		const shapePoints = points();
		if (!scene || shapePoints.length === 0 || !size.displayWidth || !size.displayHeight) {
			return;
		}

		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
		for (const { x, y } of shapePoints) {
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}

		const width = maxX - minX;
		const height = maxY - minY;
		const cx = minX + width / 2;
		const cy = minY + height / 2;

		// a single point (or points on one spot) has no size to fit, so it is only centered
		const fitted = width > 0 || height > 0
			? Math.min(
				width > 0 ? size.displayWidth / width : Infinity,
				height > 0 ? size.displayHeight / height : Infinity,
			) * CUSTOM_SHAPE_EDITOR_VIEW.FIT_MARGIN
			: CUSTOM_SHAPE_EDITOR_VIEW.START_ZOOM;
		const zoom = Math.min(CUSTOM_SHAPE_EDITOR_VIEW.MAX_ZOOM, Math.max(CUSTOM_SHAPE_EDITOR_VIEW.MIN_ZOOM, fitted));

		const view = scene.transformService.transforms;
		view.zoom = zoom;
		// same mapping the shape preview uses: the shape's center goes to the canvas center, y is flipped
		view.panX = -cx * zoom;
		view.panY = cy * zoom;
	}

	/** fits the view to the points on the canvas right now (an imported shape can be anywhere) */
	function fitView() {
		if (scene) {
			fitViewToPoints(scene.canvas.canvasSize);
		}
	}

	const onResize = (size: CanvasSize) => {
		if (!hasFitted && size.displayWidth && size.displayHeight) {
			hasFitted = true;
			fitViewToPoints(size);
		}
	};

	// points are edited both from the canvas and from the list, so any change must repaint
	watch(points, requestRedraw, { deep: true });
	// the selection is always replaced, never mutated, so the shallow watch is enough
	watch(selectedIndices, requestRedraw);
	watch(isStale, requestRedraw);
	// results are replaced as a whole when they are calculated, imported or cleared
	watch(crossSectionProperties, () => {
		syncOverlays();
		requestRedraw();
	});
	// the mesh is shown again each time the results are replaced
	watch(crossSectionMesh, (triangles) => {
		if (!meshTargets) {
			return;
		}
		showMesh(triangles);
		requestRedraw();
	});

	onMounted(() => {
		const canvasEl = canvasRef.value!;

		scene = new CanvasScene({
			canvasEl,
			wrapper: wrapperRef.value!,
			minSize: { width: 100, height: 100 },
			minZoom: CUSTOM_SHAPE_EDITOR_VIEW.MIN_ZOOM,
			maxZoom: CUSTOM_SHAPE_EDITOR_VIEW.MAX_ZOOM,
			startZoom: CUSTOM_SHAPE_EDITOR_VIEW.START_ZOOM,
			draw: redraw,
			onResize,
		});
		canvasEl.style.cursor = CURSOR.CROSSHAIR;

		const context = scene.context;
		gridTargets = new DrawTargetsCollection<Grid>({ context });
		gridTargets.add(new Grid());
		axisTargets = new DrawTargetsCollection<MainAxis>({ context });
		axisTargets.add(new MainAxis());
		meshTargets = new DrawTargetsCollection<MeshView>({ context });
		// a shape that was calculated before shows its saved mesh again right away
		showMesh(crossSectionMesh.value);
		polygonTargets = new DrawTargetsCollection<PolygonDrawTarget>({ context });
		// the editor owns the box, so it is created first for the draw target to read it
		const editor = new PolygonEditor({
			canvas: canvasEl,
			inputService: scene.inputService,
			transformService: scene.transformService,
			getPoints: points,
			getSelectedIndices: () => selectedIndices.value,
			setSelectedIndices: (indices) => { selectedIndices.value = indices; },
			getSnapStep,
			onChange: requestRedraw,
		});
		polygonTargets.add(new PolygonDrawTarget(points, () => selectedIndices.value, () => editor.getSelectionBox()));
		overlayTargets = new DrawTargetsCollection<DrawableTarget>({ context });
		overlayTargets.add(...overlays.targets);
		// a shape that was calculated before shows its saved results again right away
		syncOverlays();

		scaleBarTargets = new DrawTargetsCollection<ScaleBar>({ context });
		scaleBarTargets.add(new ScaleBar());

		scene.addService(editor);

		scene.initialize();
	});

	onUnmounted(() => {
		scene?.deactivate();
	});

	return { fitView, requestRedraw };
}
