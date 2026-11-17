<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(defineProps<{
	title: string;
	message: string;
	confirmLabel?: string;
	onConfirm: () => void;
	onReject: () => void;
}>(), {
	confirmLabel: 'Confirm',
});

const confirmRef = ref<HTMLButtonElement | null>(null);

let previousFocus: HTMLElement | null = null;

onMounted(() => {
	previousFocus = document.activeElement as HTMLElement | null;
	confirmRef.value?.focus();
});

// return the focus to where it was before the modal opened
onBeforeUnmount(() => {
	if (previousFocus && previousFocus !== document.body && previousFocus.isConnected) {
		previousFocus.focus();
	}
});

function onModalKeydown(event: KeyboardEvent) {
	// shortcuts of the app (undo and so on) must not see these keys
	event.stopPropagation();
	// a key that belongs to an input method (IME) composition is not a command
	if (event.isComposing || event.keyCode === 229) {
		return;
	}
	if (event.key === 'Escape') {
		props.onReject();
	}
}
</script>

<template>
	<Teleport defer to=".modals-container">
		<div class="modal-overlay" tabindex="-1" @keydown="onModalKeydown">
			<div class="modal" role="dialog" aria-modal="true" :aria-label="title">
				<div class="modal-header">
					<span class="modal-title">{{ title }}</span>
					<button type="button" class="modal-close" aria-label="Close" @click="props.onReject">✕</button>
				</div>

				<p class="modal-message">{{ message }}</p>

				<div class="modal-actions">
					<button type="button" class="modal-btn modal-btn--secondary" @click="props.onReject">Cancel</button>
					<button ref="confirmRef" type="button" class="modal-btn" @click="props.onConfirm">{{ confirmLabel }}</button>
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

.modal-message {
	margin: 0;
	font-size: 12px;
	line-height: 1.4;
}

.modal-actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
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

.modal-btn--secondary {
	background: var(--color-fill);
	color: var(--color-text);
}

.modal-btn--secondary:hover {
	background: var(--color-fill-hover);
	opacity: 1;
}
</style>
