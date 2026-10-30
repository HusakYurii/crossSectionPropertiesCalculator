import { watch } from "vue";
import type { Geometry } from "../../../../interfaces/beams/common.types";
import { useCrossSectionPropertiesSolver } from "./useCrossSectionPropertiesSolver";

/**
 * Keeps the cross section properties and polygon of a form's geometry up to date with the simple
 * (closed-form / polygon) solver: it runs once right away and again on every change of the geometry.
 * A form returns both from `defineExpose`, and the modal reads them from there.
 */
export const useSimpleFormSolver = <T extends Geometry>(geometry: T) => {
	const { crossSectionProperties, crossSectionPolygon, calculateProperties } = useCrossSectionPropertiesSolver();

	watch(() => geometry, (value) => calculateProperties(value), { deep: true, immediate: true });

	return { crossSectionProperties, crossSectionPolygon };
};
