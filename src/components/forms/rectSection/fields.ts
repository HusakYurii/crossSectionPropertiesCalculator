import type { ShapeField } from '../components/shapeField';
import type { RectangleGeometry } from '../../../interfaces/beams/RectSection.types';

export const RECTANGLE_FIELDS: ShapeField<RectangleGeometry>[] = [
	{ key: 'w', label: 'Width (w)', unit: 'mm' },
	{ key: 'h', label: 'Height (h)', unit: 'mm' },
];

export const CORNER_RADIUS_FIELD: ShapeField<RectangleGeometry> = { key: 'r', label: 'Corner radius (r)', unit: 'mm' };
