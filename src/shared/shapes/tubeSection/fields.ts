import type { ShapeField } from '../types/shapeField.types';
import type { OSectionGeometry, OSectionHollowGeometry } from '../types/OSection.types';

export const TUBE_FIELDS: ShapeField<OSectionGeometry>[] = [
	{ key: 'd1', label: 'Outer diameter (d1)', unit: 'mm' },
];

export const INNER_DIAMETER_FIELD: ShapeField<OSectionHollowGeometry> = { key: 'd2', label: 'Inner diameter (d2)', unit: 'mm' };
