import { ref } from "vue";
import type { Directive } from "vue";

type RenameListItemOptions = {
	// undefined when the item no longer exists
	getName: (uid: string) => string | undefined;
	// only called with a trimmed, non-empty, changed name
	onRename: (uid: string, name: string) => void;
	onRenameStart?: (uid: string) => void;
};

export const useRenameListItem = (options: RenameListItemOptions) => {

	const editingUid = ref<string | null>(null);
	const draftName = ref('');

	function isRenaming(uid: string) {
		return editingUid.value === uid;
	}

	function startRename(uid: string) {
		const name = options.getName(uid);
		if (name === undefined) {
			return;
		}
		draftName.value = name;
		editingUid.value = uid;
		options.onRenameStart?.(uid);
	}

	function commitRename() {
		// enter removes the input, which can fire blur, so a second call must do nothing
		if (editingUid.value === null) {
			return;
		}
		const uid = editingUid.value;
		const name = draftName.value.trim();
		editingUid.value = null;
		const current = options.getName(uid);
		// the item may have been deleted or undone during the edit
		if (current === undefined || name === '' || name === current) {
			return;
		}
		options.onRename(uid, name);
	}

	function cancelRename() {
		// clearing first makes the blur that may follow a no-op
		editingUid.value = null;
	}

	function onRenameKeydown(event: KeyboardEvent) {
		// enter confirms an ime candidate here, not the name
		if (event.isComposing) {
			return;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			commitRename();
		}
		else if (event.key === 'Escape') {
			event.preventDefault();
			cancelRename();
		}
	}

	// focus without a template ref inside v-for and without nextTick
	const vRenameFocus: Directive<HTMLInputElement> = {
		mounted(el) {
			el.focus();
			el.select();
		},
	};

	return {
		editingUid,
		draftName,
		isRenaming,
		startRename,
		commitRename,
		cancelRename,
		onRenameKeydown,
		vRenameFocus,
	}
}
