<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { sanitizeCsvFileName } from './exportCsvPoints.ts';

const props = defineProps<{
	initialName?: string;
	/** called with the trimmed, non-empty name */
	onConfirm: (name: string) => void;
	onReject: () => void;
}>();

const name = ref(props.initialName ?? '');
const inputRef = ref<HTMLInputElement | null>(null);

const overlayRef = ref<HTMLElement | null>(null);
const trimmedName = computed(() => name.value.trim());
// a name of only invalid characters would be saved under the default name, so it is not accepted
const canConfirm = computed(() => sanitizeCsvFileName(name.value) !== '');

let previousFocus: HTMLElement | null = null;

onMounted(() => {
	previousFocus = document.activeElement as HTMLElement | null;
	inputRef.value?.focus();
	inputRef.value?.select();
});

// without this the focus falls to body and the section window behind stops getting the keys (Esc)
onBeforeUnmount(() => {
	if (previousFocus && previousFocus !== document.body && previousFocus.isConnected) {
		previousFocus.focus();
		return;
	}
	// Safari does not focus a button on click, so there may be nothing to return to
	const overlays = document.querySelectorAll<HTMLElement>('.modals-container .modal-overlay');
	for (const overlay of overlays) {
		if (overlay !== overlayRef.value) {
			overlay.focus();
			return;
		}
	}
});

function confirm() {
	if (!canConfirm.value) {
		return;
	}
	props.onConfirm(trimmedName.value);
}

function onModalKeydown(event: KeyboardEvent) {
	// shortcuts of the app (undo and so on) and the section window behind must not see these keys
	event.stopPropagation();
	// a key that belongs to an input method (IME) composition is not a command
	if (event.isComposing || event.keyCode === 229) {
		return;
	}
	if (event.key === 'Escape') {
		props.onReject();
	} else if (event.key === 'Enter' && !(event.target instanceof HTMLButtonElement)) {
		// buttons keep their own Enter, so the close button does not confirm
		event.preventDefault();
		confirm();
	}
}
</script>

<template>
	<Teleport defer to=".modals-container">
		<div ref="overlayRef" class="modal-overlay" tabindex="-1" @keydown="onModalKeydown">
			<div class="modal" role="dialog" aria-modal="true" aria-label="Export CSV">
				<div class="modal-header">
					<span class="modal-title">Export CSV</span>
					<button type="button" class="modal-close" aria-label="Close" @click="props.onReject">✕</button>
				</div>

				<label class="modal-field">
					<span class="modal-label">File name</span>
					<span class="modal-input-box">
						<input ref="inputRef" v-model="name" type="text" class="modal-input" aria-label="File name" />
						<span class="modal-suffix">.csv</span>
					</span>
				</label>

				<div class="modal-actions">
					<button type="button" class="modal-btn" :disabled="!canConfirm" @click="confirm">OK</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style scoped>
.modal-overlay {
	position: fixed;
	inset: 0;
	z-index: 100;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--color-overlay);
	outline: none;
}

.modal {
	width: 320px;
	max-width: 90%;
	padding: 16px;
	display: flex;
	flex-direction: column;
	gap: 14px;
	background: var(--color-surface-chrome);
	border: 1px solid var(--color-border-subtle);
	border-radius: 10px;
	box-shadow: 0 12px 32px var(--color-shadow-strong);
	color: var(--color-text);
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.modal-title {
	font-size: 13px;
	font-weight: 700;
}

.modal-close {
	flex-shrink: 0;
	width: 24px;
	height: 24px;
	border: none;
	border-radius: 50%;
	background: var(--color-fill);
	color: var(--color-text);
	font-size: 12px;
	line-height: 1;
	cursor: pointer;
}

.modal-close:hover {
	background: var(--color-fill-hover);
}

.modal-field {
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.modal-label {
	font-size: 11px;
	opacity: 0.7;
}

.modal-input-box {
	display: flex;
	align-items: center;
	height: 30px;
	padding: 0 8px;
	gap: 4px;
	border: 1px solid var(--color-border-subtle);
	border-radius: 6px;
	background: var(--color-surface-canvas);
}

.modal-input {
	flex: 1;
	min-width: 0;
	border: none;
	background: transparent;
	color: var(--color-text);
	font-size: 12px;
	outline: none;
}

.modal-suffix {
	font-size: 12px;
	opacity: 0.6;
	user-select: none;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
}

.modal-btn {
	height: 32px;
	padding: 0 14px;
	border: none;
	border-radius: 6px;
	background: var(--color-text);
	color: var(--color-surface-chrome);
	font-size: 13px;
	cursor: pointer;
}

.modal-btn:hover {
	opacity: 0.9;
}

.modal-btn:disabled {
	opacity: 0.4;
	cursor: not-allowed;
}
</style>
