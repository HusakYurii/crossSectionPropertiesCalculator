import type { HollowRectangleGeometry, RoundedHollowRectangleGeometry } from "../../../../interfaces/beams/RectSection.types";
import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { createFrame } from "./frame";
import { LeaderWithArrow } from "../../../middle/view/canvas/annotations/LeaderWithArrow";
import { DimensionsWithLabel } from "../../../middle/view/canvas/annotations/DimensionsWithLabel";

/**
 * Local coords come from HollowRectangleStrategy: both rectangles are centered on (0, 0).
 * The outer size (w1, h1) is dimensioned outside the shape. The inner size (w2, h2) is
 * dimensioned inside the hole, with the line running from wall to wall, so its extension
 * lines would only cross the wall. Those two lines sit off the axes through the centroid
 * so their labels don't land on the dashed x / y axes.
 * The single corner radius is only shown (and only used by the solver) for HOLLOW_ROUNDED_RECTANGLE.
 */
export function getHollowRectangleAnnotations(
	g: HollowRectangleGeometry | RoundedHollowRectangleGeometry,
	centroid: Point
): DrawableTarget[] {
	const { p, leader, rotation } = createFrame(g.rotation, centroid);
	const hW1 = g.w1 / 2;
	const hH1 = g.h1 / 2;
	const hW2 = g.w2 / 2;
	const hH2 = g.h2 / 2;

	const annotations: DrawableTarget[] = [
		// Outer width (w1)
		new DimensionsWithLabel({
			rotation,
			uid: 'w1',
			start: p(-hW1, -hH1),
			end: p(hW1, -hH1),
			along: 'X',
			offset: -30,
			label: 'w1',
		}),
		// Outer height (h1)
		new DimensionsWithLabel({
			rotation,
			uid: 'h1',
			start: p(-hW1, -hH1),
			end: p(-hW1, hH1),
			along: 'Y',
			offset: -30,
			label: 'h1',
		}),
		// Inner width (w2) - inside the hole, above the x axis
		new DimensionsWithLabel({
			rotation,
			uid: 'w2',
			start: p(-hW2, hH2 / 2),
			end: p(hW2, hH2 / 2),
			along: 'X',
			offset: 0,
			label: 'w2',
		}),
		// Inner height (h2) - inside the hole, left of the y axis
		new DimensionsWithLabel({
			rotation,
			uid: 'h2',
			start: p(-hW2 / 2, -hH2),
			end: p(-hW2 / 2, hH2),
			along: 'Y',
			offset: 0,
			label: 'h2',
		}),
	];

	if (g.type === 'HOLLOW_ROUNDED_RECTANGLE') {
		// same clamp the polygon strategy applies to the outer corner
		const r = Math.max(0, Math.min(g.r, hW1, hH1));
		// middle of the top-right outer corner arc: centered at (hW1 - r, hH1 - r), PI/2 -> 0
		const rTip = {
			x: hW1 - r + r * Math.cos(Math.PI * 0.25),
			y: hH1 - r + r * Math.sin(Math.PI * 0.25),
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
