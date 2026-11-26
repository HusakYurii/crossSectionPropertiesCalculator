import { describe, expect, it } from 'vitest';
import type { Point } from '@/shared/types/geometry';
import { getHollowRectangleRingLengths } from '@/solvers';
import type { HollowRectangleGeometry } from '@/shared/shapes/types/RectSection.types';
import { ALL_FIXTURES } from './fixtures';
import { buildPolygon, expectPolygonClose, golden } from './helpers';

describe('polygon strategies', () => {
	const actual: Record<string, Point[]> = {};
	for (const [name, g] of Object.entries(ALL_FIXTURES)) {
		actual[name] = buildPolygon(g).value;
	}
	const expected = golden('polygons', actual);

	for (const name of Object.keys(ALL_FIXTURES)) {
		it(`${name} matches the golden polygon`, () => {
			expect(actual[name].length).toBeGreaterThanOrEqual(3);
			expectPolygonClose(actual[name], expected[name]);
		});
	}

	it('covers every golden entry', () => {
		expect(Object.keys(expected).sort()).toEqual(Object.keys(actual).sort());
	});

	for (const name of ['HOLLOW_RECTANGLE', 'HOLLOW_RECTANGLE_90', 'HOLLOW_ROUNDED_RECTANGLE', 'HOLLOW_ROUNDED_RECTANGLE_30']) {
		it(`${name}: ring lengths add up to the polygon length`, () => {
			const g = ALL_FIXTURES[name] as HollowRectangleGeometry;
			const { outer, inner } = getHollowRectangleRingLengths(g);
			expect(outer + inner).toBe(buildPolygon(g).value.length);
		});
	}
});
