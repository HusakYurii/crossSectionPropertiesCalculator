import type { ZSectionGeometry } from "../../../../interfaces/beams/ZSection.types";
import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { createFrame } from "./frame";
import { LeaderWithArrow } from "../../../middle/view/canvas/annotations/LeaderWithArrow";
import { DimensionsWithLabel } from "../../../middle/view/canvas/annotations/DimensionsWithLabel";
import { LeaderWithDot } from "../../../middle/view/canvas/annotations/LeaderWithDot";

/**
 * Local coords come from ZSectionStrategy: (0, 0) is the bottom-left of the web.
 * The bottom flange goes right (x 0..w2), the top flange goes left
 * (x -(w1 - t_w)..t_w). Shifted by the centroid, since the preview draws every
 * polygon point as `local - centroid`.
 */
export function getZSectionAnnotations(g: ZSectionGeometry, centroid: Point): DrawableTarget[] {
	const { p, leader, rotation } = createFrame(g.rotation, centroid);

	// left edge of the top flange
	const topLeftX = -(g.w1 - g.t_w);

	// middle of the upper fillet (left of the web): arc centered at (-r1, h - t_f1 - r1), 0 -> PI/2
	const r1Tip = {
		x: -g.r1 + g.r1 * Math.cos(Math.PI * 0.25),
		y: g.h - g.t_f1 - g.r1 + g.r1 * Math.sin(Math.PI * 0.25),
	};
	// middle of the lower fillet (right of the web): arc centered at (t_w + r2, t_f2 + r2), PI -> 3PI/2
	const r2Tip = {
		x: g.t_w + g.r2 + g.r2 * Math.cos(Math.PI * 1.25),
		y: g.t_f2 + g.r2 + g.r2 * Math.sin(Math.PI * 1.25),
	};

	return [
		// Height (h) - along the far left side, so it stays clear of the top flange overhang
		new DimensionsWithLabel({
			rotation,
			uid: 'h',
			start: p(topLeftX, 0),
			end: p(topLeftX, g.h),
			along: 'Y',
			offset: -30,
			label: 'h',
		}),
		// Web thickness (t_w)
		new LeaderWithDot({
			uid: 't_w',
			anchor: p(g.t_w / 2, g.h / 3),
			label: 't_w',
			...leader('right', 'top'),
		}),
		// Top flange thickness (t_f1)
		new LeaderWithDot({
			uid: 't_f1',
			anchor: p(topLeftX + g.w1 * 0.98, g.h - g.t_f1 / 2),
			label: 't_f1',
			...leader('right', 'bottom'),
		}),
		// Top flange width (w1)
		new DimensionsWithLabel({
			rotation,
			uid: 'w1',
			start: p(topLeftX, g.h),
			end: p(g.t_w, g.h),
			along: 'X',
			offset: 30,
			label: 'w1',
		}),
		// Top web fillet (r1)
		new LeaderWithArrow({
			uid: 'r1',
			anchor: p(r1Tip.x, r1Tip.y),
			label: 'r1',
			...leader('left', 'bottom'),
		}),
		// Bottom flange thickness (t_f2)
		new LeaderWithDot({
			uid: 't_f2',
			anchor: p(g.w2 * 0.95, g.t_f2 / 2),
			label: 't_f2',
			...leader('right', 'top'),
		}),
		// Bottom web fillet (r2)
		new LeaderWithArrow({
			uid: 'r2',
			anchor: p(r2Tip.x, r2Tip.y),
			label: 'r2',
			...leader('right', 'top'),
		}),
		// Bottom flange width (w2)
		new DimensionsWithLabel({
			rotation,
			uid: 'w2',
			start: p(0, 0),
			end: p(g.w2, 0),
			along: 'X',
			offset: -30,
			label: 'w2',
		}),
	];
}
