// SELECT is not here: it has no native undo, and focus stays on it after a change, so Cmd+Z must still reach the history
const inputTags = new Set(['INPUT', 'TEXTAREA']);
export const isEditingNativeInputsNow = (target: EventTarget | null) => {
	return target instanceof HTMLElement
		&& (target.isContentEditable || inputTags.has(target.tagName));
}

/*
	On a non-Latin layout `key` is a localized character, so the physical key decides;
	Latin layouts (Dvorak) go by key
*/
export const isLetterPressed = (event: KeyboardEvent, letter: string, code: string) => {
	const key = event.key.toLowerCase();
	return key === letter || (event.code === code && !/^[a-z]$/.test(key));
}
