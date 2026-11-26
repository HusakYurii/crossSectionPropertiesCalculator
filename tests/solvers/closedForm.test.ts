import { describe, expect, it } from 'vitest';
import { FIXTURES } from './fixtures';
import { buildPolygon, solveProperties } from './helpers';

const props = (name: string, patch: object = {}) => {
	const g = { ...FIXTURES[name], ...patch };
	return solveProperties(g, buildPolygon(g).value).value;
};

describe('closed form checks (independent of the goldens)', () => {
	it('rectangle: A = w h, Ix = w h^3 / 12', () => {
		const p = props('RECTANGLE');
		expect(p.A).toBeCloseTo(100 * 200, 2);
		expect(p.Ix).toBeCloseTo(100 * 200 ** 3 / 12, 0);
		expect(p.Iy).toBeCloseTo(200 * 100 ** 3 / 12, 0);
	});

	it('tube: I = pi d^4 / 64', () => {
		const d = 60.3;
		const p = props('TUBE');
		// the circle is a polygon, so the tolerance is relative
		expect(p.Ix / (Math.PI * d ** 4 / 64)).toBeCloseTo(1, 2);
		expect(p.A / (Math.PI * d ** 2 / 4)).toBeCloseTo(1, 2);
	});

	it('hollow tube: I = pi (D^4 - d^4) / 64', () => {
		const p = props('HOLLOW_TUBE');
		expect(p.Ix / (Math.PI * (60.3 ** 4 - 52.3 ** 4) / 64)).toBeCloseTo(1, 2);
	});

	it('sharp hollow rectangle: I = (w1 h1^3 - w2 h2^3) / 12', () => {
		const p = props('HOLLOW_RECTANGLE');
		expect(p.Ix).toBeCloseTo((100 * 50 ** 3 - 90 * 40 ** 3) / 12, 0);
		expect(p.Iy).toBeCloseTo((50 * 100 ** 3 - 40 * 90 ** 3) / 12, 0);
	});

	it('a rotated L has the area of the unrotated one', () => {
		expect(props('L_SECTION_0', { rotation: 37 }).A).toBeCloseTo(props('L_SECTION_0').A, 2);
		expect(props('L_SECTION_90').A).toBeCloseTo(props('L_SECTION_0').A, 2);
	});
});
