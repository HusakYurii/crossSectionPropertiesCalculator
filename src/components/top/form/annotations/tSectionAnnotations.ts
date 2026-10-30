import type { TSectionGeometry } from "../../../../interfaces/beams/TSection.types";
import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { createFrame } from "./frame";
import { LeaderWithArrow } from "../../../middle/view/canvas/annotations/LeaderWithArrow";
import { DimensionsWithLabel } from "../../../middle/view/canvas/annotations/DimensionsWithLabel";
import { LeaderWithDot } from "../../../middle/view/canvas/annotations/LeaderWithDot";

/**
 * Local coords come from TSectionStrategy: (0, 0) is the bottom-left of the web, the web is
 * x 0..t_w and the flange is x -b..(w - b) at y (h - t_f)..h. Shifted by the centroid, since
 * the preview draws every polygon point as `local - centroid`.
 * Dimension lines go outside the shape; the dot / arrow leaders all go down and to the right,
 * into the empty space under the flange.
 */
export function getTSectionAnnotations(g: TSectionGeometry, centroid: Point): DrawableTarget[] {
	const { p, leader, rotation } = createFrame(g.rotation, centroid);

	const flangeLeft = -g.b;
	const flangeRight = g.w - g.b;
	const flangeBottom = g.h - g.t_f;

	// same clamp the polygon strategy applies, so the arrow lands on the drawn fillet
	const r = Math.max(0, Math.min(g.r, g.b, flangeRight - g.t_w, flangeBottom));
	// middle of the fillet right of the web: arc centered at (t_w + r, h - t_f - r), PI/2 -> PI
	const rTip = {
		x: g.t_w + r + r * Math.cos(Math.PI * 0.75),
		y: flangeBottom - r + r * Math.sin(Math.PI * 0.75),
	};

	const annotations: DrawableTarget[] = [
		// Height (h) - along the far left side, so it stays clear of the flange overhang
		new DimensionsWithLabel({
			rotation,
			uid: 'h',
			start: p(flangeLeft, 0),
			end: p(flangeLeft, g.h),
			along: 'Y',
			offset: -30,
			label: 'h',
		}),
		// Flange width (w) - outer line, so the shorter b line nests under it
		new DimensionsWithLabel({
			rotation,
			uid: 'w',
			start: p(flangeLeft, g.h),
			end: p(flangeRight, g.h),
			along: 'X',
			offset: 35,
			label: 'w',
		}),
		// Flange offset (b) - flange left side to web left side
		new DimensionsWithLabel({
			rotation,
			uid: 'b',
			start: p(flangeLeft, g.h),
			end: p(0, g.h),
			along: 'X',
			offset: 15,
			label: 'b',
		}),
		// Web thickness (t_w)
		new LeaderWithDot({
			uid: 't_w',
			anchor: p(g.t_w / 2, g.h * 0.3),
			label: 't_w',
			...leader('right', 'bottom'),
		}),
		// Flange thickness (t_f) - in the middle of the right overhang
		new LeaderWithDot({
			uid: 't_f',
			anchor: p((g.t_w + flangeRight) / 2, g.h - g.t_f / 2),
			label: 't_f',
			...leader('right', 'bottom'),
		}),
	];

	// Fillet radius (r) - nothing to point at when the fillet is clamped away
	if (r > 0) {
		annotations.push(new LeaderWithArrow({
			uid: 'r',
			anchor: p(rTip.x, rTip.y),
			label: 'r',
			...leader('right', 'bottom'),
		}));
	}

	return annotations;
}
