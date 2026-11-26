import type { Geometry } from '@/shared/shapes/types/common.types';
import type { Point } from '@/shared/types/geometry';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import stiffenedSkinPanel from '@/features/top-bar/exampleProjects/stiffened-skin-panel.json';

/** one realistic geometry (mm) per supported shape type; the sizes come from the example projects where there is one */
const base = { isNegative: false, rotation: 0 } as const;

export const FIXTURES: Record<string, Geometry> = {
	I_SECTION: { ...base, type: 'I_SECTION', h: 127, t_f1: 7.6, b1: 36, w1: 76, r1: 2, t_w: 4, r2: 2, t_f2: 7.6, b2: 36, w2: 76 } as Geometry,
	L_SECTION_0: { ...base, type: 'L_SECTION', h: 30, t_f1: 3, w: 30, t_f2: 3, r: 2 } as Geometry,
	L_SECTION_90: { ...base, rotation: 90, type: 'L_SECTION', h: 30, t_f1: 3, w: 30, t_f2: 3, r: 2 } as Geometry,
	RECTANGLE: { ...base, type: 'RECTANGLE', w: 100, h: 200, r: 0 } as Geometry,
	ROUNDED_RECTANGLE: { ...base, type: 'ROUNDED_RECTANGLE', w: 100, h: 60, r: 10 } as Geometry,
	HOLLOW_RECTANGLE: { ...base, type: 'HOLLOW_RECTANGLE', w1: 100, h1: 50, w2: 90, h2: 40, r: 0 } as Geometry,
	HOLLOW_RECTANGLE_90: { ...base, rotation: 90, type: 'HOLLOW_RECTANGLE', w1: 100, h1: 50, w2: 90, h2: 40, r: 0 } as Geometry,
	HOLLOW_ROUNDED_RECTANGLE: { ...base, type: 'HOLLOW_ROUNDED_RECTANGLE', w1: 100, h1: 50, w2: 90, h2: 40, r: 7.5 } as Geometry,
	HOLLOW_ROUNDED_RECTANGLE_30: { ...base, rotation: 30, type: 'HOLLOW_ROUNDED_RECTANGLE', w1: 100, h1: 50, w2: 90, h2: 40, r: 7.5 } as Geometry,
	TUBE: { ...base, type: 'TUBE', d1: 60.3 } as Geometry,
	HOLLOW_TUBE: { ...base, type: 'HOLLOW_TUBE', d1: 60.3, d2: 52.3 } as Geometry,
	C_SECTION: { ...base, type: 'C_SECTION', h: 100, t_f1: 8.5, w1: 50, r1: 8, t_w: 6, r2: 8, t_f2: 8.5, w2: 50 } as Geometry,
	T_SECTION: { ...base, type: 'T_SECTION', h: 100, w: 100, t_f: 11, t_w: 11, b: 44.5, r: 6 } as Geometry,
	Z_SECTION: { ...base, type: 'Z_SECTION', h: 160, t_f1: 2.5, w1: 65, r1: 4, t_w: 2.5, r2: 4, t_f2: 2.5, w2: 65 } as Geometry,
	Z_SECTION_30: { ...base, rotation: 30, type: 'Z_SECTION', h: 160, t_f1: 2.5, w1: 65, r1: 4, t_w: 2.5, r2: 4, t_f2: 2.5, w2: 65 } as Geometry,
};

type ExampleGeometry = Geometry & { points?: Point[] };
const lowerFlange = Object.values(stiffenedSkinPanel.state.geometry as Record<string, ExampleGeometry>)
	.find((g, i) => g.type === 'CUSTOM_SHAPE' && Object.values(stiffenedSkinPanel.state.geometryExtra as Record<string, { name: string }>)[i].name === 'Lower Flange')!;

/** the "Lower Flange" of stiffened-skin-panel: 14 points and its own FEM options */
export const CUSTOM_SHAPE: Geometry = JSON.parse(JSON.stringify(lowerFlange));

export const FEM_FIXTURE_OPTIONS = (lowerFlange as unknown as { femOptions: Record<string, number> }).femOptions;

export const H_SECTION_CSV = readFileSync(resolve(import.meta.dirname, '../../fixtures/csv/h secion.csv'), 'utf8');

/** every fixture, custom shape included */
export const ALL_FIXTURES: Record<string, Geometry> = { ...FIXTURES, CUSTOM_SHAPE };

// invalid cases
export const S_SECTION: Geometry = { ...base, type: 'S_SECTION' };
export const INVALID_HOLLOW_RECTANGLE = { ...base, type: 'HOLLOW_RECTANGLE', w1: 100, h1: 50, w2: 100, h2: 40, r: 0 } as Geometry;
export const INVALID_HOLLOW_TUBE = { ...base, type: 'HOLLOW_TUBE', d1: 52.3, d2: 60.3 } as Geometry;
