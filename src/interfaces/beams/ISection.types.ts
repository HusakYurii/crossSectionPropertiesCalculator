import type { Geometry } from "./common.types";

export interface ISectionGeometry extends Geometry {
	type: 'I_SECTION'
	// beam total height
	h: number;
	// upper flange,
	t_f1: number;
	b1: number;  // distance between top left flange side and web left side
	w1: number;

	// web top fillet
	r1: number;
	// web
	t_w: number;
	// web lower fillet
	r2: number;

	// lower flange,
	t_f2: number;
	b2: number; // distance between lower left flange side and web left side
	w2: number;

}
