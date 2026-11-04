import { onMounted, onUnmounted } from 'vue';
import { history } from '../store/history';

const inputTags = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const isEditingNativeInputsNow = (target: EventTarget | null) => {
	return target instanceof HTMLElement
		&& (target.isContentEditable || inputTags.has(target.tagName));
}

/** 
 * Cmd/Ctrl+Z undoes, 
 * Shift+Cmd/Ctrl+Z and Ctrl+Y redo.
 * Not used by the report page
 *  */
export const useHistoryShortcuts = () => {
	/*
		On a non-Latin layout `key` is a localized character, so the physical key decides;
		Latin layouts (Dvorak) go by key
	*/
	const isLetterPressed = (event: KeyboardEvent, letter: string, code: string) => {
		const key = event.key.toLowerCase();
		return key === letter || (event.code === code && !/^[a-z]$/.test(key));
	}

	const onKeydown = (event: KeyboardEvent) => {
		// the native undo of a text field keeps working
		if (isEditingNativeInputsNow(event.target)) {
			return;
		}
		const hasModifier = event.ctrlKey || event.metaKey;
		if (!hasModifier || event.altKey) {
			return;
		}
		if (isLetterPressed(event, 'z', 'KeyZ')) {
			event.preventDefault();
			event.shiftKey ? history.redo() : history.undo();
		}
		// mostly for native support of Redo on Windows
		else if (isLetterPressed(event, 'y', 'KeyY') && event.ctrlKey && !event.metaKey) {
			event.preventDefault();
			history.redo();
		}
	}

	onMounted(() => window.addEventListener('keydown', onKeydown));
	onUnmounted(() => window.removeEventListener('keydown', onKeydown));
}
