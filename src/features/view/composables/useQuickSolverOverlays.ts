import { computed, watch } from 'vue';
import { toast } from 'vue3-toastify';
import { store } from '@/store/store';
import { getCompositeParts } from '@/store/compositeParts';
import { appSessionState, toggleQuickSolver } from '@/store/appSessionState';
import { compositeCrossSectionPropertiesSolver } from '@/solvers';
import { anyQuickSolverToggleOn } from '@/store/viewToggles';

/**
 * State of the solver quick actions: which toggles are on (kept in the session state, so they are not saved with the
 * project and are reset to off on a new or imported project) and the properties of the whole section while any is.
 * The result is a computed over the reactive store, so it follows shape drags, edits, undo and delete by itself.
 */
export const useQuickSolverOverlays = () => {
	const toggles = appSessionState.quickSolverToggles;

	// nothing is solved while all the toggles are off
	const result = computed(() => anyQuickSolverToggleOn(toggles) ? compositeCrossSectionPropertiesSolver.solve(getCompositeParts(store)) : null);

	// once per new error, not on every recalculation; an empty canvas is not worth a warning, the overlay is just hidden
	watch(() => (result.value && !result.value.ok && result.value.error.code !== 'no-shapes' ? result.value.error.message : null), (error) => {
		error && toast.warning(error);
	});

	const properties = computed(() => result.value?.ok ? result.value.value : null);

	return { toggles, properties, toggle: toggleQuickSolver };
};
