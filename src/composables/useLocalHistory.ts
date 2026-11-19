import { ref } from 'vue';
import { copyPlainData, isSamePlainData } from '../utils/plainData';

const MAX_STEPS = 100;

type LocalHistoryOptions<T> = {
	/** the tracked state; read on every commit, copied by the composable */
	source: () => T;
	/** writes a snapshot back; receives its own copy, free to keep / mutate */
	restore: (snapshot: T) => void;
	/** undo / redo do nothing while true (a drag, a nested dialog) */
	isBlocked?: () => boolean;
};

/**
 * Undo / redo for one component. Same idea as the app history: `base` is the last committed state,
 * commit() compares the source with it, and a forgotten commit just joins the next step.
 * It knows nothing about the store, so its lifetime is the lifetime of the component that calls it.
 */
export function useLocalHistory<T>(options: LocalHistoryOptions<T>) {
	const { source, restore, isBlocked } = options;

	// plain arrays on purpose, so Vue does not wrap them. Only canUndo and canRedo are reactive
	const undoStack: T[] = [];
	const redoStack: T[] = [];
	let base = copyPlainData(source());

	const canUndo = ref(false);
	const canRedo = ref(false);

	function updateFlags() {
		canUndo.value = undoStack.length > 0;
		canRedo.value = redoStack.length > 0;
	}

	/** Saves what changed since the last commit as one step. Does nothing when there is no difference */
	function commit(): boolean {
		const current = copyPlainData(source());
		if (isSamePlainData(current, base)) {
			return false;
		}
		undoStack.push(base);
		base = current;
		redoStack.length = 0;
		while (undoStack.length > MAX_STEPS) {
			undoStack.shift();
		}
		updateFlags();
		return true;
	}

	/** restoring makes the source equal to the base, so the next commit is a no-op and a restore is never a step */
	function move(from: T[], to: T[]): boolean {
		if (isBlocked?.()) {
			return false;
		}
		// edits that are still waiting become part of what is taken back
		commit();
		const snapshot = from.pop();
		if (!snapshot) {
			updateFlags();
			return false;
		}
		to.push(base);
		base = snapshot;
		restore(copyPlainData(snapshot));
		updateFlags();
		return true;
	}

	const undo = () => move(undoStack, redoStack);
	const redo = () => move(redoStack, undoStack);

	return { canUndo, canRedo, commit, undo, redo };
}
