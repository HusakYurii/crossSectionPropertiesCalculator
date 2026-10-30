import { SHAPE_TYPES } from "../../interfaces/beams/common.types";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { RoundedRectangleGeometry } from "../../interfaces/beams/RectSection.types";
import { buildArcPoints } from "../poligonUtils/buildArcPoints";
import { AbstractPolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";

export class RoundedRectangleStrategy extends AbstractPolygonBuildStrategy<RoundedRectangleGeometry> {
	test(geometry: Geometry) {
		return geometry.type === SHAPE_TYPES.ROUNDED_RECTANGLE;
	}

	execute(geometry: RoundedRectangleGeometry) {
		const { w, h } = geometry;
		const hW = w / 2;
		const hH = h / 2;
		// A corner cannot be rounder than half of the short side. Past that the arcs overlap and the polygon crosses itself,
		// so the radius stops there, which gives a full round end (a stadium) at the most.
		const r = Math.max(0, Math.min(geometry.r, hW, hH));
		const rSegments = AbstractPolygonBuildStrategy.remapRadiusToSegments(r);

		const polygon = [
			{ x: -hW, y: -hH + r },
			{ x: -hW, y: hH - r },
			...buildArcPoints(
				{ x: -hW + r, y: hH - r },
				r,
				Math.PI,
				Math.PI / 2,
				rSegments
			),
			{ x: hW - r, y: hH },
			...buildArcPoints(
				{ x: hW - r, y: hH - r },
				r,
				Math.PI / 2,
				0,
				rSegments
			),
			{ x: hW, y: -hH + r },
			...buildArcPoints(
				{ x: hW - r, y: -hH + r },
				r,
				0,
				-Math.PI / 2,
				rSegments
			),
			{ x: -hW + r, y: -hH },
			...buildArcPoints(
				{ x: -hW + r, y: -hH + r },
				r,
				Math.PI * 1.5,
				Math.PI,
				rSegments
			),
		];
		return this._rotatePolygon(polygon, { x: 0, y: 0 }, geometry.rotation);
	}
}
