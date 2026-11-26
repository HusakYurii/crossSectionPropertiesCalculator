import { expect } from 'vitest';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Geometry } from '@/shared/shapes/types/common.types';
import type { Point } from '@/shared/types/geometry';
import type { Triangle } from '@/shared/types/mesh';
import type { FEMMeshOptions } from '@/shared/types/femMeshOptions';
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from '@/shared/types/sectionProperties';
import type { Result } from '@/solvers';
import {
	compositeCrossSectionPropertiesSolver,
	crossSectionPolygonsBuilder,
	crossSectionPropertiesSolver,
	femCrossSectionPropertiesSolver,
} from '@/solvers';
import { getCompositeParts } from '@/store/compositeParts';

/**
 * The ONLY file of the tests that touches the solver API: when the API changes, only these wrappers change.
 * `error` is set when the solver reports a failure.
 */
export interface Outcome<T> { value: T; error?: { code: string; message: string } }

/** a failed result keeps the old "empty" value, so the tests read the same before and after */
const toOutcome = <T>(r: Result<T>, empty: T): Outcome<T> =>
	r.ok ? { value: r.value } : { value: empty, error: { code: r.error.code, message: r.error.message } };

export const buildPolygon = (g: Geometry): Outcome<Point[]> => toOutcome(crossSectionPolygonsBuilder.build(g), []);

export const solveProperties = (g: Geometry, polygon: Point[]): Outcome<CrossSectionProperties> =>
	toOutcome(crossSectionPropertiesSolver.solve(g, polygon), { ...EMPTY_CROSS_SECTION_PROPERTIES });

export const solveComposite = (state: unknown): Outcome<CrossSectionProperties | null> => {
	const r = compositeCrossSectionPropertiesSolver.solve(getCompositeParts(state as Parameters<typeof getCompositeParts>[0]));
	return r.ok ? { value: r.value } : { value: null, error: { code: r.error.code, message: r.error.message } };
};

export const solveFem = (polygon: Point[], options?: FEMMeshOptions): { properties: CrossSectionProperties; triangles: Triangle[] } =>
	femCrossSectionPropertiesSolver.solve(polygon, options);

/** the closed-form Green theorem calculator, for the FEM comparison */
export { calculateCrossSectionProperties } from '@/solvers/propertyStrategies/greenTheoremCalculator';

export const PROPERTY_KEYS: (keyof CrossSectionProperties)[] = [
	'A', 'centroid_x', 'centroid_y', 'Ix', 'Iy', 'Ixy', 'theta_p_deg', 'I_u', 'I_v',
	'Ip', 'rx', 'ry', 'r_u', 'r_v', 'Wx_top', 'Wx_bot', 'Wy_rt', 'Wy_lf',
];

/** NaN is stored as null in JSON, so it is compared as "both not a number" */
export function expectPropertiesClose(actual: CrossSectionProperties, expected: CrossSectionProperties) {
	for (const key of PROPERTY_KEYS) {
		const a = actual[key];
		const e = expected[key];
		if (e === null || Number.isNaN(e)) {
			expect(a === null || Number.isNaN(a), key).toBe(true);
		} else {
			expect(a, key).toBeCloseTo(e, 2);
		}
	}
}

export function expectPolygonClose(actual: Point[], expected: Point[]) {
	expect(actual.length).toBe(expected.length);
	actual.forEach((p, i) => {
		expect(p.x).toBeCloseTo(expected[i].x, 6);
		expect(p.y).toBeCloseTo(expected[i].y, 6);
	});
}

const GOLDEN_DIR = resolve(dirname(fileURLToPath(import.meta.url)), 'golden');

/** Compares with tests/solvers/golden/<name>.json. UPDATE_GOLDEN=1 writes it (allowed only when the goldens are first recorded). */
export function golden<T>(name: string, actual: T): T {
	const file = resolve(GOLDEN_DIR, `${name}.json`);
	if (process.env.UPDATE_GOLDEN === '1') {
		mkdirSync(GOLDEN_DIR, { recursive: true });
		writeFileSync(file, JSON.stringify(actual, null, '\t') + '\n');
		return actual;
	}
	expect(existsSync(file), `missing golden ${name}.json`).toBe(true);
	return JSON.parse(readFileSync(file, 'utf8')) as T;
}

/** the CSV fixtures start with a BOM and an `x,y` header */
export function parseCsv(text: string): Point[] {
	return text
		.replace(/^﻿/, '')
		.split(/\r?\n/)
		.map(l => l.trim())
		.filter(l => l.length > 0)
		.slice(1)
		.map(l => {
			const [x, y] = l.split(',').map(Number);
			return { x, y };
		});
}
