import type { ISectionGeometry } from "../../../../interfaces/beams/ISection.types";
import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { createFrame } from "./frame";
import { LeaderWithArrow } from "../../../middle/view/canvas/annotations/LeaderWithArrow";
import { DimensionsWithLabel } from "../../../middle/view/canvas/annotations/DimensionsWithLabel";
import { LeaderWithDot } from "../../../middle/view/canvas/annotations/LeaderWithDot";

/**
 * Anchors are computed from the geometry in the I polygon's local coords (see
 * ISectionStrategy: bottom-left of the bottom flange is (0, 0)) and shifted by
 * the centroid, because the preview draws every polygon point as `local - centroid`.
 */
export function getISectionAnnotations(g: ISectionGeometry, centroid: Point): DrawableTarget[] {
	const { p, leader, rotation } = createFrame(g.rotation, centroid);

	// left edge of the top flange
	const topLeftX = g.b2 - g.b1;

	// middle of the upper-left web fillet: its arc is centered at (b2 - r1, h - t_f1 - r1)
	// and runs from 0 to PI/2, so its middle is at PI/4
	const r1Center = { x: g.b2 - g.r1, y: g.h - g.t_f1 - g.r1 };
	const r1Tip = {
		x: r1Center.x + g.r1 * Math.cos(Math.PI * 0.25),
		y: r1Center.y + g.r1 * Math.sin(Math.PI * 0.25),
	};

	// middle of the lower-right web fillet (center of its arc is at angle 5/4 PI)
	const r2Center = { x: g.b2 + g.t_w + g.r2, y: g.t_f2 + g.r2 };
	const r2Tip = {
		x: r2Center.x + g.r2 * Math.cos(Math.PI * 1.25),
		y: r2Center.y + g.r2 * Math.sin(Math.PI * 1.25),
	};

	return [
		// Height (h)
		new DimensionsWithLabel({
			rotation,
			uid: 'h',
			start: p(0, 0),
			end: p(0, g.h),
			along: 'Y',
			offset: -30,
			label: 'h',
		}),
		// Web thickness (t_w)
		new LeaderWithDot({
			uid: 't_w',
			anchor: p(g.b2 + g.t_w / 2, g.h / 3),
			label: 't_w',
			...leader('left', 'top'),
		}),
		//Top flange thickness (t_f1)
		new LeaderWithDot({
			uid: 't_f1',
			anchor: p((g.b2 + (g.t_w + g.w1) / 2) - 5, g.h - g.t_f1 / 2),
			label: 't_f1',
			...leader('right', 'bottom'),
		}),
		// Top flange width (w1) - outer line, so the shorter b1 line nests inside it
		new DimensionsWithLabel({
			rotation,
			uid: 'w1',
			start: p(topLeftX, g.h),
			end: p(topLeftX + g.w1, g.h),
			along: 'X',
			offset: 35,
			label: 'w1',
		}),
		// Top flange offset (b1) - top flange left side to web left side
		new DimensionsWithLabel({
			rotation,
			uid: 'b1',
			start: p(topLeftX, g.h),
			end: p(g.b2, g.h),
			along: 'X',
			offset: 15,
			label: 'b1',
		}),
		// Top web fillet (r1) - points into the empty corner, down and to the left
		new LeaderWithArrow({
			uid: 'r1',
			anchor: p(r1Tip.x, r1Tip.y),
			label: 'r1',
			...leader('left', 'bottom'),
		}),
		// Bottom flange thickness (t_f2)
		new LeaderWithDot({
			uid: 't_f2',
			anchor: p(g.w2 - 5, g.t_f2 / 2),
			label: 't_f2',
			...leader('right', 'bottom'),
		}),
		// Bottom flange offset (b2) - bottom flange left side to web left side
		new DimensionsWithLabel({
			rotation,
			uid: 'b2',
			start: p(0, 0),
			end: p(g.b2, 0),
			along: 'X',
			offset: -15,
			label: 'b2',
		}),
		// Bottom web fillet (r2)
		new LeaderWithArrow({
			uid: 'r2', anchor: p(r2Tip.x, r2Tip.y), label: 'r2',
			...leader('right', 'top'),
		}),
		// Bottom flange width (w2) - outer line, so the shorter b2 line nests inside it
		new DimensionsWithLabel({
			rotation,
			uid: 'w2',
			start: p(0, 0),
			end: p(g.w2, 0),
			along: 'X',
			offset: -35,
			label: 'w2',
		}),
	];
}
