import type { Geometry } from "./common.types";

export interface LSectionGeometry extends Geometry {
	type: 'L_SECTION'
	// left flange (vertical flange)
	h: number;
	t_f1: number;

	// lower flange (horizontal flange)
	w: number;
	t_f2: number;

	// fillet between flanges
	r: number;

}

