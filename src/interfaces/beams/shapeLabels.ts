import { SHAPE_TYPES } from './common.types';

type ShapeType = keyof typeof SHAPE_TYPES;

export const SHAPE_LABELS: Record<ShapeType, string> = {
	RECTANGLE: 'Rectangle',
	HOLLOW_RECTANGLE: 'Hollow Rectangle',
	ROUNDED_RECTANGLE: 'Rounded Rectangle',
	HOLLOW_ROUNDED_RECTANGLE: 'Hollow Rounded Rectangle',
	TUBE: 'Tube',
	HOLLOW_TUBE: 'Hollow Tube',
	I_SECTION: 'I Shape',
	C_SECTION: 'C Shape',
	T_SECTION: 'T Shape',
	L_SECTION: 'L Shape',
	S_SECTION: 'S Shape',
	Z_SECTION: 'Z Shape',
	FILLET: 'Fillet',
	TRIANGLE: 'Triangle',
	CUSTOM_SHAPE: 'Custom Shape',
};

// Every form runs its own solver and exposes the result; the modal only shows and saves it.
// The solver switch in the header is information only: the shapes below are solved with FEM
// (on request, from their own form), every other shape with the simple solver.
export const FEM_SHAPE_TYPES = new Set<ShapeType>([SHAPE_TYPES.CUSTOM_SHAPE]);
