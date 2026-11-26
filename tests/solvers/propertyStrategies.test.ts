import { describe, expect, it } from 'vitest';
import type { CrossSectionProperties } from '@/shared/types/sectionProperties';
import { ALL_FIXTURES } from './fixtures';
import { buildPolygon, expectPropertiesClose, golden, solveProperties } from './helpers';

describe('properties strategies', () => {
	const actual: Record<string, CrossSectionProperties> = {};
	for (const [name, g] of Object.entries(ALL_FIXTURES)) {
		actual[name] = solveProperties(g, buildPolygon(g).value).value;
	}
	const expected = golden('properties', actual);

	for (const name of Object.keys(ALL_FIXTURES)) {
		it(`${name} has a positive area and matches the golden properties`, () => {
			expect(actual[name].A).toBeGreaterThan(0);
			expectPropertiesClose(actual[name], expected[name]);
		});
	}

	it('covers every golden entry', () => {
		expect(Object.keys(expected).sort()).toEqual(Object.keys(actual).sort());
	});
});
