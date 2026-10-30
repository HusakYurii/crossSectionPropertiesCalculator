import type { Point } from "../common/types";

export const SHAPE_TYPES = {
	RECTANGLE: "RECTANGLE",
	HOLLOW_RECTANGLE: "HOLLOW_RECTANGLE",
	ROUNDED_RECTANGLE: "ROUNDED_RECTANGLE",
	HOLLOW_ROUNDED_RECTANGLE: "HOLLOW_ROUNDED_RECTANGLE",


	TUBE: "TUBE",
	HOLLOW_TUBE: "HOLLOW_TUBE",

	I_SECTION: 'I_SECTION',
	C_SECTION: 'C_SECTION',
	T_SECTION: 'T_SECTION',
	L_SECTION: 'L_SECTION',
	S_SECTION: 'S_SECTION',
	Z_SECTION: 'Z_SECTION',

	FILLET: 'FILLET',
	TRIANGLE: 'TRIANGLE',

	CUSTOM_SHAPE: 'CUSTOM_SHAPE',
} as const

export interface Geometry {
	isNegative: boolean;
	// this one is in deg so convert to radians if needed
	rotation: number;// impacts the cross section properties because the shape rotates
	type: keyof typeof SHAPE_TYPES;
}