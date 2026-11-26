import type { Point } from '@/shared/types/geometry';
import type { CrossSectionProperties } from '@/shared/types/sectionProperties';
import type { Geometry } from '@/shared/shapes/types/common.types';
import type { HollowRectangleGeometry, RoundedHollowRectangleGeometry } from '@/shared/shapes/types/RectSection.types';

/**
 * What a beam view reads. The app store matches it structurally, and so do the shadow stores of the
 * form preview and the report, so every caller passes its own object as it is.
 */
export interface BeamViewData {
	readonly geometry: Readonly<Record<string, Geometry>>;
	readonly geometryExtra: Readonly<Record<string, { readonly position: Point }>>;
	readonly crossSectionProperties: Readonly<Record<string, CrossSectionProperties>>;
	readonly crossSectionPolygon: Readonly<Record<string, Point[]>>;
}

export interface BeamViewDeps {
	/** splits a hollow-rectangle polygon (outer ring, then inner): pass the solvers' getHollowRectangleRingLengths */
	getHollowRectangleRingLengths: (g: HollowRectangleGeometry | RoundedHollowRectangleGeometry) => { outer: number; inner: number };
}

export interface GenericBeamViewParams {
	uid: string;
	data: BeamViewData;
	deps: BeamViewDeps;
}
