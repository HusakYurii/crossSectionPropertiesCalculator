import type { ShapeField } from '../components/shapeField';
import type { LSectionGeometry } from '../../../interfaces/beams/LSection.types';

export const L_SECTION_FIELDS: ShapeField<LSectionGeometry>[] = [
	{ key: 'h', label: 'Vertical flange height (h)', unit: 'mm' },
	{ key: 't_f1', label: 'Vertical flange thickness (t_f1)', unit: 'mm' },
	{ key: 'w', label: 'Horizontal flange width (w)', unit: 'mm' },
	{ key: 't_f2', label: 'Horizontal flange thickness (t_f2)', unit: 'mm' },
	{ key: 'r', label: 'Fillet radius (r)', unit: 'mm' },
];
