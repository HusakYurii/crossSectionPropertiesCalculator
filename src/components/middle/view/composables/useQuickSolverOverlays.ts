import { computed, watch } from 'vue';
import { toast } from 'vue3-toastify';
import { appSessionState, store, toggleQuickSolver } from '../../../../store/store';
import { compositeCrossSectionPropertiesSolver } from '../../../../solvers/CompositeCrossSectionPropertiesSolver';
import { anyQuickSolverToggleOn } from '../../../../interfaces/quickSolverToggles';

/**
 * State of the solver quick actions: which toggles are on (kept in the session state, so they are saved with the
 * project) and the properties of the whole section while any is.
 * The result is a computed over the reactive store, so it follows shape drags, edits, undo and delete by itself.
 */
export const useQuickSolverOverlays = () => {
	const toggles = appSessionState.quickSolverToggles;

	// nothing is solved while all the toggles are off
	const result = computed(() => anyQuickSolverToggleOn(toggles) ? compositeCrossSectionPropertiesSolver.solve(store) : null);

	// once per new error, not on every recalculation; an empty canvas is not worth a warning, the overlay is just hidden
	watch(() => (result.value && 'error' in result.value && result.value.code !== 'no-shapes' ? result.value.error : null), (error) => {
		error && toast.warning(error);
	});

	const properties = computed(() => result.value && 'properties' in result.value ? result.value.properties : null);

	return { toggles, properties, toggle: toggleQuickSolver };
};
