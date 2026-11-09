<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { infoPanelState, closeInfoPanel, type InfoTopic } from '../../store/infoPanel.ts';

const props = defineProps<{ topic: InfoTopic }>();

const panelElRef = ref<HTMLElement | null>(null);
const isVisible = computed(() => infoPanelState.topic === props.topic);

let previouslyFocused: HTMLElement | null = null;

watch(isVisible, (visible) => {
	if (visible) {
		previouslyFocused = document.activeElement as HTMLElement | null;
		nextTick(() => panelElRef.value?.focus());
	} else {
		// back to the element that opened the panel, so the modal underneath keeps its keyboard handling.
		// After the next render: until then the rest of the app is still inert and cannot take focus
		const elToFocus = previouslyFocused;
		previouslyFocused = null;
		nextTick(() => elToFocus?.focus());
	}
});

function onKeydown(event: KeyboardEvent) {
	event.stopPropagation();
	if (event.key === 'Escape') {
		closeInfoPanel();
	}
}
</script>

<template>
	<Teleport defer to=".info-page-container">
		<Transition name="info-backdrop">
			<div v-if="isVisible" class="info-backdrop" @click="closeInfoPanel" />
		</Transition>
		<Transition name="info-panel">
			<aside v-if="isVisible" ref="panelElRef" class="info-panel" role="dialog" aria-modal="true"
				tabindex="-1" @keydown="onKeydown">
				<button type="button" class="info-panel__close" aria-label="Close" @click="closeInfoPanel">✕</button>
				<slot />
			</aside>
		</Transition>
	</Teleport>
</template>

<style scoped>
.info-backdrop {
	position: fixed;
	inset: 0;
	background: var(--color-overlay-strong);
}

.info-panel {
	position: fixed;
	top: 0;
	left: 0;
	bottom: 0;
	width: 90vw;
	padding: 48px 32px 32px;
	overflow-y: auto;
	background: var(--color-surface-chrome);
	box-shadow: 0 0 32px var(--color-shadow-strong);
	color: var(--color-text);
	outline: none;
}

.info-panel__close {
	position: absolute;
	top: 12px;
	right: 16px;
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

.info-panel__close:hover {
	background: var(--color-fill-hover);
}

.info-panel :slotted(h2) {
	margin: 0 0 16px;
}

.info-panel :slotted(p) {
	margin: 0 0 12px;
	line-height: 1.5;
}

.info-panel :slotted(code) {
	padding: 1px 4px;
	border-radius: 4px;
	background: var(--color-fill);
}

.info-backdrop-enter-active,
.info-backdrop-leave-active {
	transition: opacity 600ms ease;
}

.info-backdrop-enter-from,
.info-backdrop-leave-to {
	opacity: 0;
}

.info-panel-enter-active,
.info-panel-leave-active {
	transition: transform 600ms ease;
}

.info-panel-enter-from,
.info-panel-leave-to {
	transform: translateX(-100%);
}
</style>
