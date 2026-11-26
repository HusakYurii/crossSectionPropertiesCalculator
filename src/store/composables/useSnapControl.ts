import { computed } from 'vue';
import { SNAP } from '@/shared/math/snap';
import type { SnapStep } from '@/shared/math/snap';
import { appSessionState, setSnappingEnabled, setSnappingStep } from '../appSessionState';

/** the snap setting in the session state, shaped for the snap control */
export function useSnapControl() {
	const enabled = computed(() => appSessionState.snapping.enabled);

	const step = computed<SnapStep>({
		get: () => appSessionState.snapping.step,
		set: setSnappingStep,
	});

	const toggle = () => setSnappingEnabled(!appSessionState.snapping.enabled);

	const options = SNAP.STEPS.map((value) => ({ value, label: `${value} mm` }));

	return { enabled, step, toggle, options };
}
