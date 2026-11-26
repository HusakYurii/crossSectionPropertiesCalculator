
export type Point = { x: number, y: number; }
/**
 * We always build config polygons as closed paths going clockwise 
 */
export type Polygon = Point[];

export type Sizes = {
	width: number;
	height: number;
}

export type BoundingBox = Point & Sizes;
