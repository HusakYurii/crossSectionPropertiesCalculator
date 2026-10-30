import type { Geometry } from "./common.types";

export interface ZSectionGeometry extends Geometry {
	type: 'Z_SECTION',
	// beam total height
	h: number;

	// upper flange,
	t_f1: number;
	w1: number;

	// web top fillet
	r1: number;
	// web
	t_w: number;
	// web lower fillet
	r2: number;

	// lower flange,
	t_f2: number;
	w2: number;


}

