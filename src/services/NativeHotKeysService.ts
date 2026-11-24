import type { Service } from '../interfaces/common/types';
import { MAC_HOT_KEYS_LABELS, WINDOWS_HOT_KEYS_LABELS } from '../constants/hotKeysLabels.ts';
import { operatingSystemService } from './OperatingSystemService.ts';

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

/** a key that belongs to an input method (IME) composition is not a command */
export const isImeComposing = (event: KeyboardEvent) => event.isComposing || event.keyCode === 229;

/** Cmd on Mac, Ctrl elsewhere */
export const hasModKey = (event: { ctrlKey: boolean; metaKey: boolean }) => event.ctrlKey || event.metaKey;

// Elements where Enter already does something of its own, so a dialog must not take it over
const OWN_ENTER_SELECTOR = [
	'button', 'a[href]', 'summary', 'select', 'textarea',
	'[contenteditable=""]', '[contenteditable="true"]',
	'input[type=button]', 'input[type=submit]', 'input[type=reset]', 'input[type=file]',
	'input[type=image]', 'input[type=color]',
	'[role=button]', '[role=combobox]', '[role=listbox]', '[role=menuitem]',
	'[data-own-enter]',
].join(',');

export const hasOwnEnterAction = (target: EventTarget | null) => {
	return target instanceof Element && target.closest(OWN_ENTER_SELECTOR) !== null;
}

export type HotKeyId = 'undo' | 'redo' | 'copy' | 'paste' | 'duplicate';

type HotKeyDefinition = {
	matches: (event: KeyboardEvent) => boolean;
}

/** Cmd/Ctrl+letter with no Alt, no Shift and no auto-repeat */
const isPlainModLetter = (event: KeyboardEvent, letter: string, code: string) => {
	return hasModKey(event) && !event.altKey && !event.shiftKey && !event.repeat && isLetterPressed(event, letter, code);
}

export const HOT_KEYS: Record<HotKeyId, HotKeyDefinition> = {
	undo: {
		matches: (e) => hasModKey(e) && !e.altKey && !e.shiftKey && isLetterPressed(e, 'z', 'KeyZ'),
	},
	redo: {
		matches: (e) => hasModKey(e) && !e.altKey && e.shiftKey && isLetterPressed(e, 'z', 'KeyZ'),
	},
	copy: {
		// selected text on the page is copied the usual way
		matches: (e) => isPlainModLetter(e, 'c', 'KeyC') && !window.getSelection()?.toString(),
	},
	paste: {
		matches: (e) => isPlainModLetter(e, 'v', 'KeyV'),
	},
	duplicate: {
		matches: (e) => isPlainModLetter(e, 'd', 'KeyD'),
	},
};

const HOT_KEY_IDS = Object.keys(HOT_KEYS) as HotKeyId[];

/**
 * Returning `false` means "not handled": the event is left alone and the browser keeps its behaviour
 * (e.g. Cmd+D bookmark). Anything else prevents the default.
 */
export type HotKeyHandler = () => boolean | void;

export type HotKeyOptions = {
	/** see the note on the class */
	capture?: boolean;
};

/**
 * Detects the app shortcuts and calls the subscribed handlers.
 *
 * Bubble subscribers (the app history, the shape clipboard): a modal that stops keydown from bubbling silences them.
 *
 * Capture subscribers (the history of the shape dialog): the modal's stop would hide the key from them too,
 * so they listen in the capture phase. They always preventDefault and stop the event, so the key never reaches
 * the bubble subscribers, even when the handler is blocked and does nothing. Do not unify the two.
 *
 * If several handlers are subscribed to one id in the same phase, only the most recently added one is called
 * (a dialog opened later wins).
 */
export class NativeHotKeysService implements Service {
	private _bubbleHandlers = new Map<HotKeyId, HotKeyHandler[]>();
	private _captureHandlers = new Map<HotKeyId, HotKeyHandler[]>();

	initialize(): void {
		window.addEventListener('keydown', this._onCaptureKeyDown, true);
		window.addEventListener('keydown', this._onBubbleKeyDown, false);
	}

	deactivate(): void {
		window.removeEventListener('keydown', this._onCaptureKeyDown, true);
		window.removeEventListener('keydown', this._onBubbleKeyDown, false);
	}

	on(id: HotKeyId, handler: HotKeyHandler, options: HotKeyOptions = {}): () => void {
		const map = options.capture ? this._captureHandlers : this._bubbleHandlers;
		const list = map.get(id) ?? [];
		list.push(handler);
		map.set(id, list);
		return () => {
			const current = map.get(id);
			const index = current?.lastIndexOf(handler) ?? -1;
			if (index !== -1) {
				current!.splice(index, 1);
			}
		};
	}

	/** the shortcut text for menu hints, in the layout of the current OS */
	getLabel(id: HotKeyId): string {
		return (operatingSystemService.isMacOS() ? MAC_HOT_KEYS_LABELS : WINDOWS_HOT_KEYS_LABELS)[id];
	}

	private _match(event: KeyboardEvent, map: Map<HotKeyId, HotKeyHandler[]>): HotKeyHandler | null | undefined {
		// the native undo, copy and paste of a text field keep working
		if (isEditingNativeInputsNow(event.target)) {
			return undefined;
		}
		for (const id of HOT_KEY_IDS) {
			if (HOT_KEYS[id].matches(event)) {
				const list = map.get(id);
				return list?.[list.length - 1];
			}
		}
		return undefined;
	}

	private _onCaptureKeyDown = (event: KeyboardEvent): void => {
		const handler = this._match(event, this._captureHandlers);
		if (!handler) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		handler();
	};

	private _onBubbleKeyDown = (event: KeyboardEvent): void => {
		const handler = this._match(event, this._bubbleHandlers);
		if (!handler) {
			return;
		}
		if (handler() !== false) {
			event.preventDefault();
		}
	};
}

export const nativeHotKeysService = new NativeHotKeysService();
