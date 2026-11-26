import type { ComputedRef, Ref } from 'vue';
import type { Geometry } from '@/shared/shapes/types/common.types';
import type { CrossSectionProperties } from '@/shared/types/sectionProperties';
import type { Point } from '@/shared/types/geometry';
import type { Triangle } from '@/shared/types/mesh';

export type SectionFormResult = {
	geometry: Geometry;
	crossSectionProperties: CrossSectionProperties;
	crossSectionPolygon: Point[];
	/** only forms that mesh the shape (FEM) have one; it is saved next to the polygon */
	crossSectionMesh?: Triangle[];
};
/**
 * What the modal reads from formRef (Vue unwraps the refs). isValid is optional: a form that can be
 * in a state it cannot be saved from (a custom shape with too few points, or results that are out of date) exposes it.
 */
export type SectionFormExpose = SectionFormResult & { isValid?: boolean };
/** what a form passes to defineExpose: each value may be a ref of the same type */
export type SectionFormExposeSource = { [K in keyof SectionFormExpose]: SectionFormExpose[K] | Ref<SectionFormExpose[K]> | ComputedRef<SectionFormExpose[K]> };
