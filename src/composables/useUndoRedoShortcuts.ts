import { onMounted, onUnmounted } from 'vue';

type UndoRedoShortcutsOptions = {
	undo: () => unknown;
	redo: () => unknown;
	/** see the note below: the dialog's own history listens in the capture phase */
	capture?: boolean;
};

// SELECT is not here: it has no native undo, and focus stays on it after a change, so Cmd+Z must still reach the history
const inputTags = new Set(['INPUT', 'TEXTAREA']);
const isEditingNativeInputsNow = (target: EventTarget | null) => {
	return target instanceof HTMLElement
		&& (target.isContentEditable || inputTags.has(target.tagName));
}

/*
	On a non-Latin layout `key` is a localized character, so the physical key decides;
	Latin layouts (Dvorak) go by key
*/
const isLetterPressed = (event: KeyboardEvent, letter: string, code: string) => {
	const key = event.key.toLowerCase();
	return key === letter || (event.code === code && !/^[a-z]$/.test(key));
}

/**
 * Cmd/Ctrl+Z undoes,
 * Shift+Cmd/Ctrl+Z and Ctrl+Y redo.
 *
 * The app history listens in the bubble phase: the shape dialog stops keydown from bubbling, so while it is
 * open the app history never hears the key. The history of a dialog listens in the capture phase, because
 * that stop would hide the key from it too. It also stops the event, so the key never reaches the app
 * listener, even when its own undo is blocked. Do not unify the two.
 */
export const useUndoRedoShortcuts = ({ undo, redo, capture = false }: UndoRedoShortcutsOptions) => {
	const onKeydown = (event: KeyboardEvent) => {
		// the native undo of a text field keeps working
		if (isEditingNativeInputsNow(event.target)) {
			return;
		}
		const hasModifier = event.ctrlKey || event.metaKey;
		if (!hasModifier || event.altKey) {
			return;
		}

		let action: (() => unknown) | null = null;
		if (isLetterPressed(event, 'z', 'KeyZ')) {
			action = event.shiftKey ? redo : undo;
		}
		// mostly for native support of Redo on Windows
		else if (isLetterPressed(event, 'y', 'KeyY') && event.ctrlKey && !event.metaKey) {
			action = redo;
		}
		if (!action) {
			return;
		}

		event.preventDefault();
		if (capture) {
			event.stopPropagation();
		}
		action();
	}

	onMounted(() => window.addEventListener('keydown', onKeydown, capture));
	onUnmounted(() => window.removeEventListener('keydown', onKeydown, capture));
}
