import { toast } from 'vue3-toastify';
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import type { CustomShapeGeometry } from '../../../../interfaces/beams/CustomShape.types.ts';
import type { Point } from '../../../../interfaces/common/types.ts';
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from '../../../../interfaces/sectionProperties/index.ts';
import { POLYGON_LIMITS } from '../../../../constants/geometryTolerances.ts';
import { store } from '../../../../store/store.ts';
import { crossSectionPolygonsBuilder } from '../../../../solvers/CrossSectionPolygonsBuilder.ts';
import { femCrossSectionPropertiesSolver } from '../../../../solvers/FEMCrossSectionPropertiesSolver.ts';
import type { Triangle } from '../../../../solvers/femTriangulator/triangulate.ts';

/** the FEM results of the custom shape (and whether they still belong to the points on screen) */
export function useFemCalculation(geometry: CustomShapeGeometry, selectedShapeUID: string | null) {
	const stored = selectedShapeUID ? store.crossSectionProperties[selectedShapeUID] : undefined;
	const storedPolygon = selectedShapeUID ? store.crossSectionPolygon[selectedShapeUID] : undefined;
	const crossSectionProperties = ref<CrossSectionProperties>(
		stored ? { ...stored } : { ...EMPTY_CROSS_SECTION_PROPERTIES }
	);
	const crossSectionPolygon = ref<Point[]>(storedPolygon ? storedPolygon.map(({ x, y }) => ({ x, y })) : []);
	const storedMesh = selectedShapeUID ? store.crossSectionMesh[selectedShapeUID] : undefined;
	const crossSectionMesh = shallowRef<Triangle[]>(storedMesh ?? []);
	const isStale = ref(!stored);
	const isCalculating = ref(false);

	const hasEnoughPoints = computed(() => geometry.points.length >= POLYGON_LIMITS.MIN_OPEN_POINTS);
	// the button is only active while there is something to calculate: enough points, and results that
	// do not belong to the polygon on screen (yet, or any more)
	const needsRecalculation = computed(() => hasEnoughPoints.value && isStale.value && !isCalculating.value);
	const isValid = computed(() => hasEnoughPoints.value && !isStale.value && !isCalculating.value);
	// overlays only mean something for results that belong to the polygon on screen, like the mesh
	const hasResults = computed(() => !isStale.value && crossSectionProperties.value.A > 0);

	// results are only valid for the polygon and FEM settings they were calculated from (isNegative does not change them)
	watch(() => [geometry.points, geometry.femOptions], () => { isStale.value = true; }, { deep: true });

	async function calculate() {
		if (!hasEnoughPoints.value || isCalculating.value) {
			return;
		}

		isCalculating.value = true;
		// let the "Calculating..." state paint before the solver blocks the thread
		await nextTick();
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

		try {
			const polygon = crossSectionPolygonsBuilder.calculate(geometry);
			// solve (not calculate) so the mesh the numbers come from can be drawn too
			const { properties, triangles } = femCrossSectionPropertiesSolver.solve(polygon, geometry.femOptions);
			crossSectionProperties.value = properties;
			crossSectionPolygon.value = polygon;
			crossSectionMesh.value = triangles;
			isStale.value = false;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'The FEM solver failed.';
			toast.error(message)

		} finally {
			isCalculating.value = false;
		}
	}

	/** the results belong to the points they were calculated from, so a new set of points leaves none behind */
	function resetResults() {
		crossSectionProperties.value = { ...EMPTY_CROSS_SECTION_PROPERTIES };
		crossSectionPolygon.value = [];
		crossSectionMesh.value = [];
		isStale.value = true;
	}

	return {
		crossSectionProperties,
		crossSectionPolygon,
		crossSectionMesh,
		isStale,
		isCalculating,
		hasEnoughPoints,
		needsRecalculation,
		isValid,
		hasResults,
		calculate,
		resetResults,
	};
}
