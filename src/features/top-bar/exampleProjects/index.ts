import type { ExampleProjectId } from './index.types';

export const EXAMPLE_PROJECTS: Record<ExampleProjectId, { label: string; load: () => Promise<unknown> }> = {
	iBeamWithAngles: {
		label: 'I-Beam with Angles',
		load: () => import('./i-beam-with-angles.json').then(m => m.default),
	},
	boltedPlateGirder: {
		label: 'Bolted Girder',
		load: () => import('./bolted-plate-girder.json').then(m => m.default),
	},
	stiffenedSkinPanel: {
		label: 'Fuselage Frame with Skin',
		load: () => import('./stiffened-skin-panel.json').then(m => m.default),
	},
};
