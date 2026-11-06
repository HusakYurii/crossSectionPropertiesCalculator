import { Canvas, type CanvasTransformState } from '../../components/middle/view/canvas/Canvas';
import type { Store } from '../../store/store';

// getScaledSize() divides by the transform scale, which includes the dpr, so line widths and label fonts are in
// device pixels: at 2 they come out as in the editor on a retina screen. A higher scale would make labels smaller.
export const RENDER_SCALE = 2;

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

/**
 * The box around the shapes where the canvas draws them (same formula as GenericBeamView._centerPathPoints).
 * `includeOrigin` also takes in the world origin, because the dimension labels start at the world axes.
 */
export function getShapesBounds(store: Store, uids: string[], { includeOrigin = false } = {}): Bounds {
	let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

	for (const uid of uids) {
		const { centroid_x, centroid_y } = store.crossSectionProperties[uid];
		const { x: cx, y: cy } = store.geometryExtra[uid].position;
		for (const p of store.crossSectionPolygon[uid]) {
			const x = p.x - centroid_x + cx;
			const y = p.y - centroid_y + cy;
			minX = Math.min(minX, x);
			minY = Math.min(minY, y);
			maxX = Math.max(maxX, x);
			maxY = Math.max(maxY, y);
		}
	}

	if (includeOrigin) {
		minX = Math.min(minX, 0);
		minY = Math.min(minY, 0);
		maxX = Math.max(maxX, 0);
		maxY = Math.max(maxY, 0);
	}

	if (!Number.isFinite(minX)) {
		return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
	}

	return { minX, minY, maxX, maxY };
}

/** Same maths as computeFitTransform in ShapeCanvasPreview.vue, for a given box */
export function fitTransform(bounds: Bounds, width: number, height: number, margin: number): CanvasTransformState {
	const w = bounds.maxX - bounds.minX || 1;
	const h = bounds.maxY - bounds.minY || 1;
	const cx = bounds.minX + w / 2;
	const cy = bounds.minY + h / 2;

	const zoom = Math.min(width / w, height / h) * margin;

	return { zoom, panX: -cx * zoom, panY: cy * zoom };
}

/** Draws once into an offscreen canvas and returns a PNG data URL, so nothing has to be redrawn when the page reflows or prints */
export function renderStaticScene(opts: {
	width: number; height: number; // CSS px of the final image
	bounds: Bounds; margin: number;
	draw: (context: CanvasRenderingContext2D) => void;
}): string {
	const { width, height, bounds, margin, draw } = opts;
	const el = document.createElement('canvas');
	const canvas = new Canvas(el);
	canvas.resize({
		displayWidth: width,
		displayHeight: height,
		pixelWidth: width * RENDER_SCALE,
		pixelHeight: height * RENDER_SCALE,
		dpr: RENDER_SCALE,
	});
	canvas.clearAndApplyTransforms(fitTransform(bounds, width, height, margin));
	draw(canvas.context);
	return el.toDataURL('image/png');
}
