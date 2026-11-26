import { describe, expect, it } from 'vitest';
import { EMPTY_CROSS_SECTION_PROPERTIES } from '@/shared/types/sectionProperties';
import { INVALID_HOLLOW_RECTANGLE, INVALID_HOLLOW_TUBE, S_SECTION } from './fixtures';
import { buildPolygon, solveProperties } from './helpers';

describe('invalid input', () => {
	it('a shape without a polygon strategy gives an empty polygon and no-strategy', () => {
		const r = buildPolygon(S_SECTION);
		expect(r.value).toEqual([]);
		expect(r.error?.code).toBe('no-strategy');
		expect(r.error?.message).toBe('No polygon build strategy registered for geometry type: S_SECTION');
	});

	it('a shape without a properties strategy gives empty properties and no-strategy', () => {
		const r = solveProperties(S_SECTION, []);
		expect(r.value).toEqual(EMPTY_CROSS_SECTION_PROPERTIES);
		expect(r.error?.code).toBe('no-strategy');
		expect(r.error?.message).toBe('No properties build strategy registered for geometry type: S_SECTION');
	});

	for (const [name, g] of Object.entries({ INVALID_HOLLOW_RECTANGLE, INVALID_HOLLOW_TUBE })) {
		it(`${name} gives empty properties and strategy-failed`, () => {
			const r = solveProperties(g, buildPolygon(g).value);
			expect(r.value).toEqual(EMPTY_CROSS_SECTION_PROPERTIES);
			expect(r.error?.code).toBe('strategy-failed');
			expect(r.error?.message).toMatch(/must be strictly|strictly/);
		});
	}
});
