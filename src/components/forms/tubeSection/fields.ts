import type { ShapeField } from '../components/shapeField';
import type { OSectionGeometry, OSectionHollowGeometry } from '../../../interfaces/beams/OSection.types';

export const TUBE_FIELDS: ShapeField<OSectionGeometry>[] = [
	{ key: 'd1', label: 'Outer diameter (d1)', unit: 'mm' },
];

export const INNER_DIAMETER_FIELD: ShapeField<OSectionHollowGeometry> = { key: 'd2', label: 'Inner diameter (d2)', unit: 'mm' };
