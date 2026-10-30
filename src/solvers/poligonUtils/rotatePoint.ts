import type { Point } from "../../interfaces/common/types";
import { degToRad } from "../../mathUtils/anglesMath";

export const rotatePoint = (
	point: Point,
	center: Point,
	angle: number,
	isRadians: boolean = false
): Point => {
	if (!isRadians) {
		angle = degToRad(angle);
	}

	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	const dx = point.x - center.x;
	const dy = point.y - center.y;
	return {
		x: center.x + dx * cos - dy * sin,
		y: center.y + dx * sin + dy * cos,
	};
}