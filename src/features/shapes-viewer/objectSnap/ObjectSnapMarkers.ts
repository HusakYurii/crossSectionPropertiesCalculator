import type { Point } from '@/shared/types/geometry';
import { OBJECT_SNAP_STYLE } from '../constants';
import type { ObjectSnapMarkerModel } from './ObjectSnapMarkers.types';
import { drawDot, getScaledSize } from '@/shared/canvas';

const drawRing = (context: CanvasRenderingContext2D, at: Point, screenRadius: number, fill: string) => {
	context.beginPath();
	context.arc(at.x, at.y, getScaledSize(context, screenRadius), 0, Math.PI * 2);
	context.fillStyle = fill;
	context.fill();
};

/** Draws a dot on every point of every shape; the hovered one gets a ring and the selected one is red and on top. */
export function drawObjectSnapMarkers(context: CanvasRenderingContext2D, model: ObjectSnapMarkerModel) {
	const { POINT_RADIUS, HOVER_RING, SELECTED_RING, POINT, HOVER_FILL, SELECTED, SELECTED_FILL } = OBJECT_SNAP_STYLE;
	context.save();

	model.hovered && drawRing(context, model.hovered, POINT_RADIUS + HOVER_RING, HOVER_FILL);

	context.fillStyle = POINT;
	for (const shape of model.shapes) {
		for (const point of shape.points) {
			drawDot(context, point, POINT_RADIUS);
		}
	}

	if (model.selected) {
		drawRing(context, model.selected, POINT_RADIUS + SELECTED_RING, SELECTED_FILL);
		context.fillStyle = SELECTED;
		drawDot(context, model.selected, POINT_RADIUS);
	}

	context.restore();
}
