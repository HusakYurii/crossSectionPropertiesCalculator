import type { ShapeField } from '../components/shapeField';
import type { CSectionGeometry } from '../../../interfaces/beams/CSection.types';

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
