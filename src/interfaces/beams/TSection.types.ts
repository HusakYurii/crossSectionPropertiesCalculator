import type { Geometry } from "./common.types";

export interface TSectionGeometry extends Geometry {
	type: 'T_SECTION'
	// beam total height
	h: number;
	// vertical web thickness
	t_w: number;
	// upper flange thickness,
	t_f: number;

	b: number;  // distance between top left flange side and web left side
	w: number; // width of the top flange

	// web top top flange fillet radius
	r: number;
}
