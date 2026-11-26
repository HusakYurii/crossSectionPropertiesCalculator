import { ref } from "vue";
import { toast } from "vue3-toastify";
import { debounce } from "@/shared/utils/debounce";
import type { Geometry } from "@/shared/shapes/types/common.types";
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from "@/shared/types/sectionProperties";
import { crossSectionPolygonsBuilder, crossSectionPropertiesSolver } from "@/solvers";
import type { Point } from "@/shared/types/geometry";

// Module level on purpose: one debouncer per solver, shared by every form and the canvas preview, so typing through
// an invalid value shows one toast 500 ms after the last keystroke, and a valid value within 500 ms cancels it.
const [showPolygonError, clearPolygonError] = debounce((message: string) => toast.error(message), 500);
const [showPropertiesError, clearPropertiesError] = debounce((message: string) => toast.error(message), 500);

export const useCrossSectionPropertiesSolver = () => {

	const crossSectionProperties = ref<CrossSectionProperties>({ ...EMPTY_CROSS_SECTION_PROPERTIES });

	const crossSectionPolygon = ref<Point[]>([]);

	const calculateProperties = <T extends Geometry>(props: T) => {
		const built = crossSectionPolygonsBuilder.build(props);
		built.ok ? clearPolygonError() : showPolygonError(built.error.message);
		const polygon = built.ok ? built.value : [];
		const solved = crossSectionPropertiesSolver.solve(props, polygon);
		solved.ok ? clearPropertiesError() : showPropertiesError(solved.error.message);
		crossSectionPolygon.value = polygon;
		crossSectionProperties.value = solved.ok ? solved.value : { ...EMPTY_CROSS_SECTION_PROPERTIES };
	}

	return {
		crossSectionProperties,
		crossSectionPolygon,
		calculateProperties,
	}

}