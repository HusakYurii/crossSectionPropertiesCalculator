import type { SHAPE_TYPES } from '../../../../interfaces/beams/common.types';
import type { CSectionGeometry } from '../../../../interfaces/beams/CSection.types';
import type { ISectionGeometry } from '../../../../interfaces/beams/ISection.types';
import type { LSectionGeometry } from '../../../../interfaces/beams/LSection.types';
import type { OSectionGeometry, OSectionHollowGeometry } from '../../../../interfaces/beams/OSection.types';
import type { HollowRectangleGeometry, RectangleGeometry } from '../../../../interfaces/beams/RectSection.types';
import type { TSectionGeometry } from '../../../../interfaces/beams/TSection.types';
import type { ZSectionGeometry } from '../../../../interfaces/beams/ZSection.types';
import type { FEMMeshOptions } from '../../../../interfaces/FEMMeshOptions';

type NumericKeys<G> = { [K in keyof G]: G[K] extends number ? K : never }[keyof G] & string;
export type ShapeField<G = any> = { key: NumericKeys<G>; label: string; unit: string };

// Rotation and isNegative are not here: every form keeps those two hand-written

export const I_SECTION_FIELDS: ShapeField<ISectionGeometry>[] = [
	{ key: 'h', label: 'Height (h)', unit: 'mm' },
	{ key: 't_w', label: 'Web thickness (t_w)', unit: 'mm' },
	{ key: 't_f1', label: 'Top flange thickness (t_f1)', unit: 'mm' },
	{ key: 'w1', label: 'Top flange width (w1)', unit: 'mm' },
	{ key: 'b1', label: 'Top flange offset (b1)', unit: 'mm' },
	{ key: 'r1', label: 'Top web fillet (r1)', unit: 'mm' },
	{ key: 't_f2', label: 'Bottom flange thickness (t_f2)', unit: 'mm' },
	{ key: 'w2', label: 'Bottom flange width (w2)', unit: 'mm' },
	{ key: 'b2', label: 'Bottom flange offset (b2)', unit: 'mm' },
	{ key: 'r2', label: 'Bottom web fillet (r2)', unit: 'mm' },
];

export const C_SECTION_FIELDS: ShapeField<CSectionGeometry>[] = [
	{ key: 'h', label: 'Height (h)', unit: 'mm' },
	{ key: 't_w', label: 'Web thickness (t_w)', unit: 'mm' },
	{ key: 't_f1', label: 'Top flange thickness (t_f1)', unit: 'mm' },
	{ key: 'w1', label: 'Top flange width (w1)', unit: 'mm' },
	{ key: 'r1', label: 'Top web fillet (r1)', unit: 'mm' },
	{ key: 't_f2', label: 'Bottom flange thickness (t_f2)', unit: 'mm' },
	{ key: 'w2', label: 'Bottom flange width (w2)', unit: 'mm' },
	{ key: 'r2', label: 'Bottom web fillet (r2)', unit: 'mm' },
];

export const Z_SECTION_FIELDS: ShapeField<ZSectionGeometry>[] = [
	{ key: 'h', label: 'Height (h)', unit: 'mm' },
	{ key: 't_w', label: 'Web thickness (t_w)', unit: 'mm' },
	{ key: 't_f1', label: 'Top flange thickness (t_f1)', unit: 'mm' },
	{ key: 'w1', label: 'Top flange width (w1)', unit: 'mm' },
	{ key: 'r1', label: 'Top web fillet (r1)', unit: 'mm' },
	{ key: 't_f2', label: 'Bottom flange thickness (t_f2)', unit: 'mm' },
	{ key: 'w2', label: 'Bottom flange width (w2)', unit: 'mm' },
	{ key: 'r2', label: 'Bottom web fillet (r2)', unit: 'mm' },
];

export const T_SECTION_FIELDS: ShapeField<TSectionGeometry>[] = [
	{ key: 'h', label: 'Height (h)', unit: 'mm' },
	{ key: 't_w', label: 'Web thickness (t_w)', unit: 'mm' },
	{ key: 't_f', label: 'Flange thickness (t_f)', unit: 'mm' },
	{ key: 'w', label: 'Flange width (w)', unit: 'mm' },
	{ key: 'b', label: 'Flange offset (b)', unit: 'mm' },
	{ key: 'r', label: 'Fillet radius (r)', unit: 'mm' },
];

export const L_SECTION_FIELDS: ShapeField<LSectionGeometry>[] = [
	{ key: 'h', label: 'Vertical flange height (h)', unit: 'mm' },
	{ key: 't_f1', label: 'Vertical flange thickness (t_f1)', unit: 'mm' },
	{ key: 'w', label: 'Horizontal flange width (w)', unit: 'mm' },
	{ key: 't_f2', label: 'Horizontal flange thickness (t_f2)', unit: 'mm' },
	{ key: 'r', label: 'Fillet radius (r)', unit: 'mm' },
];

export const RECTANGLE_FIELDS: ShapeField<RectangleGeometry>[] = [
	{ key: 'w', label: 'Width (w)', unit: 'mm' },
	{ key: 'h', label: 'Height (h)', unit: 'mm' },
];

export const CORNER_RADIUS_FIELD: ShapeField<RectangleGeometry> = { key: 'r', label: 'Corner radius (r)', unit: 'mm' };

export const HOLLOW_RECTANGLE_FIELDS: ShapeField<HollowRectangleGeometry>[] = [
	{ key: 'w1', label: 'Outer width (w1)', unit: 'mm' },
	{ key: 'h1', label: 'Outer height (h1)', unit: 'mm' },
	{ key: 'w2', label: 'Inner width (w2)', unit: 'mm' },
	{ key: 'h2', label: 'Inner height (h2)', unit: 'mm' },
];

export const TUBE_FIELDS: ShapeField<OSectionGeometry>[] = [
	{ key: 'd1', label: 'Outer diameter (d1)', unit: 'mm' },
];

export const INNER_DIAMETER_FIELD: ShapeField<OSectionHollowGeometry> = { key: 'd2', label: 'Inner diameter (d2)', unit: 'mm' };

export const FEM_OPTION_FIELDS: { key: keyof FEMMeshOptions; label: string; unit: string }[] = [
	{ key: 'improvePasses', label: 'Improve passes', unit: '' },
	{ key: 'subdivideLevels', label: 'Subdivide levels', unit: '' },
	{ key: 'minSegmentLength', label: 'Min segment length', unit: 'mm' },
	{ key: 'minAngleDeg', label: 'Min triangle angle', unit: 'deg' },
	{ key: 'maxSteinerPoints', label: 'Max extra points', unit: '' },
	{ key: 'maxIterations', label: 'Max iterations', unit: '' },
];

// the lookup the report uses to list a shape's parameters
export const SHAPE_FIELDS: Partial<Record<keyof typeof SHAPE_TYPES, ShapeField[]>> = {
	I_SECTION: I_SECTION_FIELDS,
	C_SECTION: C_SECTION_FIELDS,
	Z_SECTION: Z_SECTION_FIELDS,
	T_SECTION: T_SECTION_FIELDS,
	L_SECTION: L_SECTION_FIELDS,
	RECTANGLE: RECTANGLE_FIELDS,
	ROUNDED_RECTANGLE: [...RECTANGLE_FIELDS, CORNER_RADIUS_FIELD],
	HOLLOW_RECTANGLE: HOLLOW_RECTANGLE_FIELDS,
	HOLLOW_ROUNDED_RECTANGLE: [...HOLLOW_RECTANGLE_FIELDS, CORNER_RADIUS_FIELD],
	TUBE: TUBE_FIELDS,
	HOLLOW_TUBE: [...TUBE_FIELDS, INNER_DIAMETER_FIELD],
};
