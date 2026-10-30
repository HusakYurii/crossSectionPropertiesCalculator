import type { RectangleGeometry, RoundedRectangleGeometry } from "../../../../interfaces/beams/RectSection.types";
import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { createFrame } from "./frame";
import { LeaderWithArrow } from "../../../middle/view/canvas/annotations/LeaderWithArrow";
import { DimensionsWithLabel } from "../../../middle/view/canvas/annotations/DimensionsWithLabel";

/**
 * Local coords come from RectangleStrategy / RoundedRectangleStrategy: the
 * rectangle is centered on (0, 0). Shifted by the centroid, since the preview
 * draws every polygon point as `local - centroid`.
 * The corner radius is only shown (and only used by the solver) for ROUNDED_RECTANGLE.
 */
export function getRectangleAnnotations(
	g: RectangleGeometry | RoundedRectangleGeometry,
	centroid: Point
): DrawableTarget[] {
	const { p, leader, rotation } = createFrame(g.rotation, centroid);
	const hW = g.w / 2;
	const hH = g.h / 2;

	const annotations: DrawableTarget[] = [
		// Width (w)
		new DimensionsWithLabel({
			rotation,
			uid: 'w',
			start: p(-hW, -hH),
			end: p(hW, -hH),
			along: 'X',
			offset: -30,
			label: 'w',
		}),
		// Height (h)
		new DimensionsWithLabel({
			rotation,
			uid: 'h',
			start: p(-hW, -hH),
			end: p(-hW, hH),
			along: 'Y',
			offset: -30,
			label: 'h',
		}),
	];

	if (g.type === 'ROUNDED_RECTANGLE') {
		// middle of the top-right corner arc: centered at (hW - r, hH - r), PI/2 -> 0
		const rTip = {
			x: hW - g.r + g.r * Math.cos(Math.PI * 0.25),
			y: hH - g.r + g.r * Math.sin(Math.PI * 0.25),
		};
		// Corner radius (r)
		annotations.push(new LeaderWithArrow({
			uid: 'r',
			anchor: p(rTip.x, rTip.y),
			label: 'r',
			...leader('right', 'top'),
		}));
	}

	return annotations;
}
