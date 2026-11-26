import type { FEMMeshOptions } from '@/shared/types/femMeshOptions';

export const FEM_OPTION_FIELDS: { key: keyof FEMMeshOptions; label: string; unit: string }[] = [
	{ key: 'improvePasses', label: 'Improve passes', unit: '' },
	{ key: 'subdivideLevels', label: 'Subdivide levels', unit: '' },
	{ key: 'minSegmentLength', label: 'Min segment length', unit: 'mm' },
	{ key: 'minAngleDeg', label: 'Min triangle angle', unit: 'deg' },
	{ key: 'maxSteinerPoints', label: 'Max extra points', unit: '' },
	{ key: 'maxIterations', label: 'Max iterations', unit: '' },
];
