import { onBeforeUnmount, ref } from "vue";

interface PanelBounds {
	min: number;
	max: number;
}

interface PanelsBounds {
	leftPanel: PanelBounds;
	rightPanel: PanelBounds;
}

const DEFAULT: PanelsBounds = {
	leftPanel: { min: 240, max: 400 },
	rightPanel: { min: 240, max: 400 },
}


export const RESIZE_TARGETS = {
	LEFT: 'LEFT',
	RIGHT: 'RIGHT',
};


export const useEditorPanelsResize = (props?: PanelsBounds) => {


	const { leftPanel, rightPanel } = { ...DEFAULT, ...props }


	const leftWidth = ref((leftPanel.min + leftPanel.max) / 2);
	const rightWidth = ref((rightPanel.min + rightPanel.max) / 2);

	let activeResize: string | null = null;
	let startPointer = 0;
	let startValue = 0;

	function clamp(value: number, min: number, max: number) {
		return Math.min(max, Math.max(min, value));
	}

	function onMouseMove(event: MouseEvent) {
		if (!activeResize) return;

		if (activeResize === RESIZE_TARGETS.LEFT) {
			const delta = event.clientX - startPointer;
			leftWidth.value = clamp(startValue + delta, leftPanel.min, leftPanel.max);
			return;
		}

		const delta = startPointer - event.clientX;
		rightWidth.value = clamp(startValue + delta, rightPanel.min, rightPanel.max);
	}

	function stopResize() {
		activeResize = null;
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', stopResize);
		document.body.style.cursor = '';
		document.body.style.userSelect = '';
	}

	function startResize(target: string, event: MouseEvent) {
		event.preventDefault();

		activeResize = target;
		startPointer = event.clientX;
		startValue = target === RESIZE_TARGETS.LEFT ? leftWidth.value : rightWidth.value;
		document.body.style.cursor = 'col-resize';

		document.body.style.userSelect = 'none';
		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', stopResize);
	}

	onBeforeUnmount(stopResize);

	return {
		leftWidth,
		rightWidth,
		startResize
	}
}
