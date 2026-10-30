import type { Geometry } from "./common.types";

export interface RectangleGeometry extends Geometry {
	type: 'RECTANGLE'
	w: number;
	h: number;
	r: number;
}

export interface HollowRectangleGeometry extends Geometry {
	type: 'HOLLOW_RECTANGLE'
	// outer rectangle
	h1: number;
	w1: number;
	// inner rectangle
	h2: number;
	w2: number;
	r: number;
}


export interface RoundedRectangleGeometry extends Omit<RectangleGeometry, 'type'> {
	type: 'ROUNDED_RECTANGLE'
}

export interface RoundedHollowRectangleGeometry extends Omit<HollowRectangleGeometry, 'type'> {
	type: 'HOLLOW_ROUNDED_RECTANGLE'

}
