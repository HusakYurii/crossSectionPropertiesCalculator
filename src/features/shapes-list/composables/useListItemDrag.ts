import { ref } from "vue";

type ListItemDragOptions = {
	getOrder: () => string[];
	onReorder: (order: string[]) => void;
	onDragStart?: () => void;
};

export const useListItemDrag = (options: ListItemDragOptions) => {

	const draggedUid = ref<string | null>(null);
	// insert position 0..n in the full list (the dragged row included), null when the pointer is outside the list
	const dropIndex = ref<number | null>(null);

	function onDragStart(event: DragEvent, uid: string) {
		draggedUid.value = uid;
		// Firefox does not start a drag without data; a private type, because text/plain could be dropped into a text input
		event.dataTransfer?.setData('application/x-shape-uid', uid);
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
		}
		options.onDragStart?.();
	}

	function onDragOver(event: DragEvent, index: number) {
		if (draggedUid.value === null) {
			return;
		}
		event.preventDefault();
		const row = event.currentTarget as HTMLElement;
		const rect = row.getBoundingClientRect();
		dropIndex.value = event.clientY < rect.top + rect.height / 2 ? index : index + 1;
	}

	function onDrop(event: DragEvent) {
		if (draggedUid.value === null || dropIndex.value === null) {
			return;
		}
		event.preventDefault();
		const uid = draggedUid.value;
		const slot = dropIndex.value;
		// dragend may not fire once the row has moved in the DOM, so clear the state here too
		onDragEnd();
		const order = options.getOrder();
		const from = order.indexOf(uid);
		if (from === -1) {
			return;
		}
		// the dragged row is removed first, so a position after it moves up by one
		const to = slot > from ? slot - 1 : slot;
		if (to === from) {
			return;
		}
		order.splice(from, 1);
		order.splice(to, 0, uid);
		options.onReorder(order);
	}

	function onDragEnd() {
		draggedUid.value = null;
		dropIndex.value = null;
	}

	function onListDragLeave(event: DragEvent) {
		// relatedTarget can be null in Safari between rows, so compare the pointer with the list bounds instead
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const { clientX, clientY } = event;
		// (0, 0) is what browsers report when the pointer left the window
		const leftWindow = clientX === 0 && clientY === 0;
		const outside = clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom;
		if (leftWindow || outside) {
			dropIndex.value = null;
		}
	}

	// the insertion line is hidden on the two slots around the dragged row, where a drop does nothing
	function isDropSlot(slot: number) {
		if (dropIndex.value !== slot || draggedUid.value === null) {
			return false;
		}
		const from = options.getOrder().indexOf(draggedUid.value);
		return slot !== from && slot !== from + 1;
	}

	function isDragging(uid: string) {
		return uid === draggedUid.value;
	}

	function isDropBefore(index: number) {
		return isDropSlot(index);
	}

	function isDropAfter(index: number) {
		return isDropSlot(index + 1) && index === options.getOrder().length - 1;
	}

	return {
		draggedUid,
		onDragStart,
		onDragOver,
		onDrop,
		onDragEnd,
		onListDragLeave,
		isDragging,
		isDropBefore,
		isDropAfter,
	}
}
