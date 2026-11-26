import type { ShapeField } from '../types/shapeField.types';
import type { TSectionGeometry } from '../types/TSection.types';

export const T_SECTION_FIELDS: ShapeField<TSectionGeometry>[] = [
	{ key: 'h', label: 'Height (h)', unit: 'mm' },
	{ key: 't_w', label: 'Web thickness (t_w)', unit: 'mm' },
	{ key: 't_f', label: 'Flange thickness (t_f)', unit: 'mm' },
	{ key: 'w', label: 'Flange width (w)', unit: 'mm' },
	{ key: 'b', label: 'Flange offset (b)', unit: 'mm' },
	{ key: 'r', label: 'Fillet radius (r)', unit: 'mm' },
];
