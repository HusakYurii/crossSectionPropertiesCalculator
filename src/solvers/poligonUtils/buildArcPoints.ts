import type { Point } from "../../interfaces/common/types";

export const buildArcPoints = (
	center: Point,
	radius: number,
	startAngle: number,
	endAngle: number,
	segments: number, // number of line segments
): Point[] => {
	const result: Point[] = [];
	for (let i = 0; i <= segments; i++) {
		const t = i / segments; // 0 → 1, includes both ends
		const angle = startAngle + (endAngle - startAngle) * t;
		result.push({
			x: center.x + radius * Math.cos(angle),
			y: center.y + radius * Math.sin(angle),
		});
	}
	return result;
};