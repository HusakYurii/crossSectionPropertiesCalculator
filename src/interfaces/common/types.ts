
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

export interface Identifiable {
	uid: string;
}

export interface Drawable {
	showDebug: boolean;
	draw: (props: { context: CanvasRenderingContext2D, isHovered?: boolean, isSelected?: boolean; }) => void;
	drawDebug: (props: { context: CanvasRenderingContext2D }) => void;
}

export interface Detectable {
	contains: (point: Point) => boolean;
	intersect: (polygon: Point[]) => boolean;
}

export type DrawTarget = Identifiable & Drawable & Detectable;

export interface Service {
	initialize: () => void;
	deactivate: () => void;
}
