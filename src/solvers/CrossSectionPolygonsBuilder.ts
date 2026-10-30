import { toast } from 'vue3-toastify';
import type { Geometry } from "../interfaces/beams/common.types";
import type { Point } from "../interfaces/common/types";
import { removeDuplicatePoints } from "./poligonUtils/removeDuplicatePoints";
import { polygonBuildStrategies } from "./polygonStrategies";
import { useDebounce } from '../composables/useDebounce';

const [showError, clear] = useDebounce((message: string) => {
	toast.error(message)
}, 500);

export class CrossSectionPolygonsBuilder {
	calculate<T extends Geometry>(geometry: T): Point[] {
		const strategy = polygonBuildStrategies.find(s => s.test(geometry));

		if (!strategy) {
			showError(`No polygon build strategy registered for geometry type: ${geometry.type}`)
			return []
		}

		try {
			const result = removeDuplicatePoints(strategy.execute(geometry));
			clear();
			return result;
		} catch (error) {
			if (error instanceof Error) {
				showError(error.message)
			}
			else {
				showError(`An error while building polygon points for geometry type: ${geometry.type}`)
			}
			return []
		}

	}
}

export const crossSectionPolygonsBuilder = new CrossSectionPolygonsBuilder();
