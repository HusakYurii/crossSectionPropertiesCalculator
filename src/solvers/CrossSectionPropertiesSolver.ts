import { toast } from 'vue3-toastify';
import type { Geometry } from "../interfaces/beams/common.types";
import type { Point } from "../interfaces/common/types";
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from "../interfaces/sectionProperties";
import { propertiesBuildStrategies } from "./propertyStrategies";
import { useDebounce } from '../composables/useDebounce';

const [showError, clear] = useDebounce((message: string) => {
	toast.error(message)
}, 500);

export class CrossSectionPropertiesSolver {

	calculate<T extends Geometry>(geometry: T, polygon: Point[]): CrossSectionProperties {
		const strategy = propertiesBuildStrategies.find(s => s.test(geometry));

		if (!strategy) {
			showError(`No properties build strategy registered for geometry type: ${geometry.type}`)
			return { ...EMPTY_CROSS_SECTION_PROPERTIES }
		}

		try {
			const result = strategy.execute(geometry, polygon);
			clear();
			return result;
		} catch (error) {
			if (error instanceof Error) {
				showError(error.message)
			}
			else {
				showError(`An error while building polygon points for geometry type: ${geometry.type}`)
			}
			return { ...EMPTY_CROSS_SECTION_PROPERTIES }
		}
	}
}

export const crossSectionPropertiesSolver = new CrossSectionPropertiesSolver();
