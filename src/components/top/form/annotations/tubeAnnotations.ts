import type { OSectionGeometry, OSectionHollowGeometry } from "../../../../interfaces/beams/OSection.types";
import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { LeaderWithArrow } from "../../../middle/view/canvas/annotations/LeaderWithArrow";
import { createFrame } from "./frame";

/**
 * Tubes are circles centered on (0, 0) (see TubeStrategy / HollowTubeStrategy).
 * Going through the frame keeps the anchors consistent with the rotated polygon.
 */
export function getTubeAnnotations(g: OSectionGeometry, centroid: Point): DrawableTarget[] {
	const { p, leader } = createFrame(g.rotation, centroid);
	const onCircle = (radius: number, angle: number) => p(radius * Math.cos(angle), radius * Math.sin(angle));

	return [
		// Outer diameter (d1) - up and to the right of the circle
		new LeaderWithArrow({
			uid: 'd1',
			anchor: onCircle(g.d1 / 2, Math.PI * 0.25),
			label: 'd1',
			...leader('right', 'top'),
		}),
	];
}

export function getHollowTubeAnnotations(g: OSectionHollowGeometry, centroid: Point): DrawableTarget[] {
	const { p, leader } = createFrame(g.rotation, centroid);
	const onCircle = (radius: number, angle: number) => p(radius * Math.cos(angle), radius * Math.sin(angle));

	return [
		// Outer diameter (d1) - up and to the right of the circle
		new LeaderWithArrow({
			uid: 'd1',
			anchor: onCircle(g.d1 / 2, Math.PI * 0.25),
			label: 'd1',
			...leader('right', 'top'),
		}),
		// Inner diameter (d2) - down and to the left, on the hole edge
		new LeaderWithArrow({
			uid: 'd2',
			anchor: onCircle(g.d2 / 2, Math.PI * 1.25),
			label: 'd2',
			...leader('left', 'bottom'),
		}),
	];
}
