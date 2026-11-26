import { describe, expect, it } from 'vitest';
import type { CrossSectionProperties } from '@/shared/types/sectionProperties';
import iBeam from '@/features/top-bar/exampleProjects/i-beam-with-angles.json';
import girder from '@/features/top-bar/exampleProjects/bolted-plate-girder.json';
import skin from '@/features/top-bar/exampleProjects/stiffened-skin-panel.json';
import { expectPropertiesClose, golden, solveComposite } from './helpers';

const EXAMPLES = { 'i-beam-with-angles': iBeam, 'bolted-plate-girder': girder, 'stiffened-skin-panel': skin };

type Rec = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

describe('composite solver', () => {
	const actual: Record<string, CrossSectionProperties> = {};
	for (const [name, json] of Object.entries(EXAMPLES)) {
		actual[name] = solveComposite(json.state).value!;
	}
	const expected = golden('composite', actual);

	for (const [name, json] of Object.entries(EXAMPLES)) {
		it(`${name} matches the golden result`, () => {
			expectPropertiesClose(actual[name], expected[name]);
		});

		it(`${name}: A = sum of sign * A_i`, () => {
			const s = json.state as unknown as Rec;
			let A = 0;
			for (const uid of Object.keys(s.geometry)) {
				A += (s.geometry[uid].isNegative ? -1 : 1) * s.crossSectionProperties[uid].A;
			}
			expect(actual[name].A).toBeCloseTo(A, 2);
		});
	}

	it('one part: the centroid is its position', () => {
		const s = girder.state as unknown as Rec;
		const uid = Object.keys(s.geometry)[0];
		const state = {
			geometry: { [uid]: s.geometry[uid] },
			geometryExtra: { [uid]: { ...s.geometryExtra[uid], position: { x: 12.5, y: -7 } } },
			crossSectionProperties: { [uid]: s.crossSectionProperties[uid] },
			crossSectionPolygon: { [uid]: s.crossSectionPolygon[uid] },
		};
		const r = solveComposite(state).value!;
		expect(r.centroid_x).toBeCloseTo(12.5, 2);
		expect(r.centroid_y).toBeCloseTo(-7, 2);
		expect(r.A).toBeCloseTo(s.crossSectionProperties[uid].A, 2);
	});

	it('no shapes: error no-shapes', () => {
		const r = solveComposite({ geometry: {}, geometryExtra: {}, crossSectionProperties: {}, crossSectionPolygon: {} });
		expect(r.error?.code).toBe('no-shapes');
	});

	it('only negative shapes: error no-area', () => {
		const s = iBeam.state as unknown as Rec;
		const uid = Object.keys(s.geometry)[0];
		const state = {
			geometry: { [uid]: { ...s.geometry[uid], isNegative: true } },
			geometryExtra: { [uid]: s.geometryExtra[uid] },
			crossSectionProperties: { [uid]: s.crossSectionProperties[uid] },
			crossSectionPolygon: { [uid]: s.crossSectionPolygon[uid] },
		};
		expect(solveComposite(state).error?.code).toBe('no-area');
	});
});
