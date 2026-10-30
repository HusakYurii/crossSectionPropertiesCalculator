import { rotatePoint } from "../poligonUtils/rotatePoint";
import type { Geometry } from "../../interfaces/beams/common.types";
import type { Point } from "../../interfaces/common/types";

export interface PolygonBuildStrategy {
	test(geometry: Geometry): boolean;
	execute(geometry: Geometry): Point[];
}

export abstract class AbstractPolygonBuildStrategy<T extends Geometry> implements PolygonBuildStrategy {
	public abstract test(geometry: Geometry): boolean;
	public abstract execute(geometry: T): Point[];

	/**
	 * 
	 * @param polygon 
	 * @param anchor Each geometry is build relative to its left button angle. For a tube it is its geometry center, for Z shape it is left button corner as well
	 * @param angle in Radians
	 * @returns 
	 */
	protected _rotatePolygon(polygon: Point[], anchor: Point, angle: number): Point[] {
		return polygon.map(p => rotatePoint(p, anchor, angle))
	}

	/**
	 * How many straight segments an arc of radius `r` is cut into: roughly one per unit of radius, between 2 and 8.
	 * It is always a whole number. buildArcPoints walks `i <= segments`, so a fractional count (a radius of 2.5)
	 * would stop part of the way round and leave the arc short of its end angle, which made corners uneven
	 * and the shape asymmetric.
	 */
	static remapRadiusToSegments = (r: number) => Math.min(8, Math.max(Math.ceil(r), 2));
}