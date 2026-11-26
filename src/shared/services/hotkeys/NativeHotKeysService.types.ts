export type HotKeyId = 'undo' | 'redo' | 'copy' | 'paste' | 'duplicate';

/**
 * Returning `false` means "not handled": the event is left alone and the browser keeps its behaviour
 * (e.g. Cmd+D bookmark). Anything else prevents the default.
 */
export type HotKeyHandler = () => boolean | void;

export type HotKeyOptions = {
	/** see the note on the class */
	capture?: boolean;
};
