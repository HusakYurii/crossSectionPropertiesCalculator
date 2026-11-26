import { toast } from 'vue3-toastify';
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import type { CustomShapeGeometry } from '@/shared/shapes/types/CustomShape.types';
import type { Point } from '@/shared/types/geometry';
import { EMPTY_CROSS_SECTION_PROPERTIES, type CrossSectionProperties } from '@/shared/types/sectionProperties';
import { copyPlainData, isSamePlainData } from '@/shared/utils/plainData';
import { store } from '@/store/store';
import { POLYGON_LIMITS, crossSectionPolygonsBuilder, femCrossSectionPropertiesSolver } from '@/solvers';
import type { FEMMeshOptions } from '@/shared/types/femMeshOptions';
import type { Triangle } from '@/shared/types/mesh';

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

	// the inputs the current results belong to: the opening geometry for a saved shape, nothing for a new one.
	// Comparing against them (and not just flagging "changed") lets an undo back to these inputs make the results fresh again
	let resultInputs: { points: Point[]; femOptions: FEMMeshOptions | undefined } | null = stored
		? copyPlainData({ points: geometry.points, femOptions: geometry.femOptions })
		: null;

	// results are only valid for the polygon and FEM settings they were calculated from (isNegative does not change them).
	// A deep watch on purpose: it walks the reactive data, so nested edits trigger it, which a computed over
	// isSamePlainData would not (that reads through toRaw and tracks nothing)
	watch(() => [geometry.points, geometry.femOptions], () => {
		isStale.value = !resultInputs
			|| !isSamePlainData({ points: geometry.points, femOptions: geometry.femOptions }, resultInputs);
	}, { deep: true });

	async function calculate() {
		if (!hasEnoughPoints.value || isCalculating.value) {
			return;
		}

		isCalculating.value = true;
		// let the "Calculating..." state paint before the solver blocks the thread
		await nextTick();
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

		try {
			// copied here, in the same sync block as solve(): an undo during the frame above cannot pair the results with other points.
			// Only kept once the solver succeeded, a failed run leaves the old results with their old inputs
			const inputs = copyPlainData({ points: geometry.points, femOptions: geometry.femOptions });
			const built = crossSectionPolygonsBuilder.build(geometry);
			if (!built.ok) {
				toast.error(built.error.message);
				return;
			}
			const polygon = built.value;
			// solve (not calculate) so the mesh the numbers come from can be drawn too
			const { properties, triangles } = femCrossSectionPropertiesSolver.solve(polygon, geometry.femOptions);
			crossSectionProperties.value = properties;
			crossSectionPolygon.value = polygon;
			crossSectionMesh.value = triangles;
			resultInputs = inputs;
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
		resultInputs = null;
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
