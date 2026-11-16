import { computed } from 'vue';
import { SNAP, type SnapStep } from '../../../../../constants/canvasInteraction';
import { appSessionState, setSnappingEnabled, setSnappingStep } from '../../../../../store/appSessionState';

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
