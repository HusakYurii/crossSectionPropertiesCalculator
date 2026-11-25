import { hasModKey, hasOwnEnterAction, isImeComposing } from '../services/singletons/NativeHotKeysService.ts';

type ModalKeyboardOptions = {
	onCancel: () => void;
	onConfirm?: () => void;
	/** Enter does nothing while this is false, like the disabled confirm button */
	canConfirm?: () => boolean;
};

/**
 * The keydown handler of a modal overlay: Escape cancels.
 * Enter-to-confirm via onConfirm is only for dialogs that cannot be a plain form (the shape dialog:
 * the focus can sit on the overlay, and the custom shape point inputs commit on change after Enter).
 * Small dialogs are a <form> and use the native submit.
 */
export function useModalKeyboard({ onCancel, onConfirm, canConfirm }: ModalKeyboardOptions) {
	return (event: KeyboardEvent) => {
		// shortcuts of the app (undo and so on) and the modals behind must not see these keys
		event.stopPropagation();
		// a key that belongs to an input method (IME) composition is not a command
		if (isImeComposing(event)) {
			return;
		}
		if (event.key === 'Escape') {
			onCancel();
			return;
		}
		if (event.key === 'Enter' && event.repeat) {
			// a held Enter from a menu item must not press the auto-focused Confirm button or submit a form
			event.preventDefault();
			return;
		}
		if (event.key !== 'Enter' || !onConfirm) {
			return;
		}
		if (hasModKey(event) || event.altKey || event.shiftKey || event.defaultPrevented) {
			return;
		}
		// no preventDefault below: the native Enter of the target (a button click, a change commit) must still run
		if (hasOwnEnterAction(event.target) || (canConfirm && !canConfirm())) {
			return;
		}
		event.preventDefault();
		onConfirm();
	};
}
