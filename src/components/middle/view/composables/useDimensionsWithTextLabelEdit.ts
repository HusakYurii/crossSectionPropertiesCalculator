import { nextTick, ref, shallowRef } from 'vue';
import { toast } from 'vue3-toastify';
import type { Point } from '../../../../interfaces/common/types';
import type { DimensionsWithTextLabel } from '../canvas/annotations/DimensionsWithTextLabel';
import { store, updateGeometryExtraData } from '../../../../store/store';
import { history } from '../../../../store/history';

type DimensionsWithTextLabelEditProps = {
	worldToScreen: (point: Point) => Point;
	canMoveTo: (shapeUid: string, position: Point) => boolean;
	getCanvas: () => HTMLCanvasElement | null;
};

const DECIMAL_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)$/;
// the input is never narrower than this, and grows with a longer text so it always covers the drawn number
export const EDITOR_MIN_WIDTH = 72;

export const useDimensionsWithTextLabelEdit = (props: DimensionsWithTextLabelEditProps) => {
	// the number editor over a dimension label; nothing is written to the store until it is applied
	const editorInputRef = ref<HTMLInputElement | null>(null);
	const editing = shallowRef<{ label: DimensionsWithTextLabel; prefill: string } | null>(null);
	const editText = ref('');
	const editorPosition = ref({ left: 0, top: 0 });

	const updateEditorPosition = () => {
		const label = editing.value?.label;
		if (!label) {
			return;
		}

		// the shape was deleted (or undone away) while its number was being edited
		if (label.value === undefined) {
			editing.value = null;
			return;
		}

		const { x, y } = props.worldToScreen(label.labelAnchor);
		editorPosition.value = { left: x, top: y };
	};

	const startEditing = (label: DimensionsWithTextLabel) => {
		if (!label.isEditable || label.shapeUid === undefined || label.value === undefined) {
			return;
		}

		// the exact value, not the rounded number on the canvas
		const prefill = String(label.value);
		editing.value = { label, prefill };
		editText.value = prefill;
		updateEditorPosition();
		nextTick(() => {
			editorInputRef.value?.focus({ preventScroll: true });
			editorInputRef.value?.select();
		});
	};

	const cancelEditing = () => {
		editing.value = null;
	};

	const applyEditing = () => {
		const current = editing.value;
		// cleared first, so nothing below can run apply a second time
		editing.value = null;
		if (!current || editText.value === current.prefill) {
			return;
		}

		const trimmed = editText.value.trim();
		// checked before Number(): Number('') is 0
		if (trimmed === '') {
			return;
		}

		const normalized = trimmed.replace(',', '.');
		// plain decimals only: Number() would also take '0x10' or '1e3'
		if (!DECIMAL_PATTERN.test(normalized)) {
			return;
		}

		const value = Number(normalized);
		const { shapeUid, axis } = current.label;
		if (shapeUid === undefined) {
			return;
		}
		const stored = store.geometryExtra[shapeUid];
		// same number typed another way (12.50 over 12.5, -0 over 0): no write, and no false overlap warning
		if (!Number.isFinite(value) || !stored || value === stored.position[axis]) {
			return;
		}

		const position = { ...stored.position, [axis]: value };
		if (!props.canMoveTo(shapeUid, position)) {
			toast.warning('The shape would overlap another shape there, so its position was not changed.');
			return;
		}

		updateGeometryExtraData({ uid: shapeUid, data: { position } });
		history.commit();
	};

	// the input opens right under the pointer, so it would otherwise swallow the zoom the canvas listens for
	const onEditorWheel = (event: WheelEvent) => {
		props.getCanvas()?.dispatchEvent(new WheelEvent('wheel', event));
	};

	const onEditorKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Enter' || event.key === 'Tab') {
			event.preventDefault();
			applyEditing();
		}
		else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEditing();
		}
	};

	// Click away applies the value. InputService calls it in the capture phase: the canvas
	// handlers read the shape's position on mousedown, before a blur would fire, so a drag would overwrite the typed value.
	const onWindowMouseDown = (event: MouseEvent) => {
		if (!editing.value || event.target === editorInputRef.value) {
			return;
		}

		applyEditing();
	};

	return {
		editorInputRef,
		editing,
		editText,
		editorPosition,
		startEditing,
		updateEditorPosition,
		onEditorKeyDown,
		onEditorWheel,
		onWindowMouseDown,
	};
}
