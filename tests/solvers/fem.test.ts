import { describe, expect, it } from 'vitest';
import type { Point } from '@/shared/types/geometry';
import type { Geometry } from '@/shared/shapes/types/common.types';
import type { CrossSectionProperties } from '@/shared/types/sectionProperties';
import { CUSTOM_SHAPE, FEM_FIXTURE_OPTIONS, H_SECTION_CSV } from './fixtures';
import { buildPolygon, calculateCrossSectionProperties, expectPropertiesClose, golden, parseCsv, solveFem } from './helpers';

const triangleArea = ([a, b, c]: [Point, Point, Point]) => Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;

const hSection: Geometry = { ...CUSTOM_SHAPE, points: parseCsv(H_SECTION_CSV), femOptions: undefined } as Geometry;
const CASES: Record<string, { polygon: Point[]; options?: Record<string, number> }> = {
	'lower-flange': { polygon: buildPolygon(CUSTOM_SHAPE).value, options: FEM_FIXTURE_OPTIONS },
	'h-section-defaults': { polygon: buildPolygon(hSection).value },
};

describe('FEM solver', () => {
	const results = Object.fromEntries(Object.entries(CASES).map(([name, c]) => [name, solveFem(c.polygon, c.options)]));
	const expected = golden('fem', Object.fromEntries(
		Object.entries(results).map(([name, r]) => [name, { triangleCount: r.triangles.length, properties: r.properties }])
	)) as Record<string, { triangleCount: number; properties: CrossSectionProperties }>;

	for (const name of Object.keys(CASES)) {
		describe(name, () => {
			const c = CASES[name];
			const r = results[name];

			it('has the golden triangle count and properties', () => {
				expect(r.triangles.length).toBe(expected[name].triangleCount);
				expectPropertiesClose(r.properties, expected[name].properties);
			});

			it('is deterministic', () => {
				expect(solveFem(c.polygon, c.options)).toEqual(r);
			});

			it('triangle areas add up to A', () => {
				const sum = r.triangles.reduce((s, t) => s + triangleArea(t), 0);
				expect(sum).toBeCloseTo(r.properties.A, 1);
			});

			it('A, Ix, Iy agree with the polygon solver', () => {
				const ref = calculateCrossSectionProperties(c.polygon, 10);
				for (const k of ['A', 'Ix', 'Iy'] as const) {
					// the FEM result is rounded to 2 decimals: allow one rounding step plus 1e-6 relative
					expect(Math.abs(r.properties[k] - ref[k]), k).toBeLessThanOrEqual(0.01 + 1e-6 * Math.abs(ref[k]));
				}
			});
		});
	}
});
