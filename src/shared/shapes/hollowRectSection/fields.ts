import type { ShapeField } from '../types/shapeField.types';
import type { HollowRectangleGeometry } from '../types/RectSection.types';

export const HOLLOW_RECTANGLE_FIELDS: ShapeField<HollowRectangleGeometry>[] = [
	{ key: 'w1', label: 'Outer width (w1)', unit: 'mm' },
	{ key: 'h1', label: 'Outer height (h1)', unit: 'mm' },
	{ key: 'w2', label: 'Inner width (w2)', unit: 'mm' },
	{ key: 'h2', label: 'Inner height (h2)', unit: 'mm' },
];

export const CORNER_RADIUS_FIELD: ShapeField<HollowRectangleGeometry> = { key: 'r', label: 'Corner radius (r)', unit: 'mm' };
