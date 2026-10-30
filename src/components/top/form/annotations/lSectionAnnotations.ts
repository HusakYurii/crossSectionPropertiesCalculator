import type { LSectionGeometry } from "../../../../interfaces/beams/LSection.types";
import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { createFrame } from "./frame";
import { LeaderWithArrow } from "../../../middle/view/canvas/annotations/LeaderWithArrow";
import { DimensionsWithLabel } from "../../../middle/view/canvas/annotations/DimensionsWithLabel";
import { LeaderWithDot } from "../../../middle/view/canvas/annotations/LeaderWithDot";

/**
 * Local coords come from LSectionStrategy: (0, 0) is the outer bottom-left corner,
 * the vertical flange is x 0..t_f1, the horizontal flange is y 0..t_f2.
 * Shifted by the centroid, since the preview draws every polygon point as `local - centroid`.
 */
export function getLSectionAnnotations(g: LSectionGeometry, centroid: Point): DrawableTarget[] {
	const { p, leader, rotation } = createFrame(g.rotation, centroid);

	// middle of the inner fillet: arc centered at (t_f1 + r, t_f2 + r), PI -> 3PI/2
	const rTip = {
		x: g.t_f1 + g.r + g.r * Math.cos(Math.PI * 1.25),
		y: g.t_f2 + g.r + g.r * Math.sin(Math.PI * 1.25),
	};

	return [
		// Vertical flange height (h)
		new DimensionsWithLabel({
			rotation,
			uid: 'h',
			start: p(0, 0),
			end: p(0, g.h),
			along: 'Y',
			offset: -30,
			label: 'h',
		}),
		// Vertical flange thickness (t_f1)
		new LeaderWithDot({
			uid: 't_f1',
			anchor: p(g.t_f1 / 2, g.h * 0.95),
			label: 't_f1',
			...leader('right', 'top'),
		}),
		// Horizontal flange width (w)
		new DimensionsWithLabel({
			rotation,
			uid: 'w',
			start: p(0, 0),
			end: p(g.w, 0),
			along: 'X',
			offset: -30,
			label: 'w',
		}),
		// Horizontal flange thickness (t_f2)
		new LeaderWithDot({
			uid: 't_f2',
			anchor: p(g.w * 0.95, g.t_f2 / 2),
			label: 't_f2',
			...leader('right', 'top'),
		}),
		// Fillet radius (r)
		new LeaderWithArrow({
			uid: 'r',
			anchor: p(rTip.x, rTip.y),
			label: 'r',
			...leader('right', 'top'),
		}),
	];
}
