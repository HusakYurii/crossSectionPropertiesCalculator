<script setup lang="ts">
import TopPanel from './components/top/TopPanel.vue';
import LeftPanel from './components/left/LeftPanel.vue';
import View from './components/middle/view/View.vue';
// import RightPanel from './components/right/RightPanel.vue';
import InfoPanels from './pages/info/InfoPanels.vue';
import { infoPanelState } from './store/infoPanel.ts';
import { useHotKey } from './composables/useHotKey.ts';
import { nativeHotKeysService } from './services/singletons/NativeHotKeysService.ts';
import { sectionModalState } from './store/sectionModal.ts';
import { copySelectedShape, duplicateSelectedShape, pasteShape } from './store/shapeClipboard.ts';
import { history } from './store/history.ts';
import { useEditorPanelsResize, RESIZE_TARGETS } from './composables/useEditorPanelsResize.ts';
import { computed, onMounted, onUnmounted } from 'vue';

// Undo and redo are in the bubble phase: the shape dialog stops keydown from bubbling, so while it is open the app
// history never hears the key (the dialog has its own history in the capture phase)
useHotKey('undo', () => { history.undo(); });
useHotKey('redo', () => { history.redo(); });

// Cmd/Ctrl+C copies the selected shape, Cmd/Ctrl+V pastes it, Cmd/Ctrl+D duplicates it without touching the clipboard.
// Like the app undo they are in the bubble phase, so a modal that stops keydown keeps them quiet.
// Returning false (nothing to do) leaves the browser its own behaviour, e.g. Cmd+D (bookmark) with no shape selected
const isClipboardBlocked = () => sectionModalState.isOpen || infoPanelState.topic !== null || history.isBlocked();
useHotKey('copy', () => !isClipboardBlocked() && copySelectedShape());
useHotKey('paste', () => !isClipboardBlocked() && pasteShape());
useHotKey('duplicate', () => !isClipboardBlocked() && duplicateSelectedShape());

const {
	leftWidth,
	// rightWidth,
	startResize
} = useEditorPanelsResize();

const shouldInert = computed(() => infoPanelState.topic !== null);

onMounted(() => {
	nativeHotKeysService.initialize();
	document.addEventListener('contextmenu', (e) => {
		e.preventDefault()
	})
})

onUnmounted(() => nativeHotKeysService.deactivate());

</script>

<template>
	<div class="app">
		<TopPanel :inert="shouldInert" />

		<div class="app-body" :inert="shouldInert">
			<div class="panel-slot panel-slot--left" :style="{ width: `${leftWidth}px` }">
				<LeftPanel class="panel-content" />
				<div class="resize-handle resize-handle--vertical resize-handle--east" aria-hidden="true"
					@mousedown="startResize(RESIZE_TARGETS.LEFT, $event)" />
			</div>

			<div class="panel-slot panel-slot--middle">
				<div class="panel-section panel-section--canvas">
					<View class="panel-content" />
				</div>
			</div>

			<!-- <div class="panel-slot panel-slot--right" :style="{ width: `${rightWidth}px` }">
				<div class="resize-handle resize-handle--vertical resize-handle--west" aria-hidden="true"
					@mousedown="startResize(RESIZE_TARGETS.RIGHT, $event)" />
				<RightPanel class="panel-content" />
			</div> -->
		</div>

		<div class="modals-container" :inert="shouldInert"></div>
		<div class="info-page-container"></div>
		<InfoPanels />
	</div>
</template>

<style scoped>
.app {
	display: flex;
	flex-direction: column;
	height: 100vh;
	overflow: hidden;
}

.modals-container,
.info-page-container {
	position: relative;
}

.modals-container {
	z-index: 100;
}

.info-page-container {
	z-index: 200;
}

.app-body {
	display: flex;
	flex: 1;
	min-height: 0;
}

.panel-slot {
	position: relative;
	display: flex;
	min-height: 0;
	min-width: 0;
}

.panel-slot--left,
.panel-slot--right {
	flex-shrink: 0;
}

.panel-slot--middle {
	flex: 1;
	flex-direction: column;
	overflow: hidden;
}

.panel-section--canvas {
	flex: 1;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
}

.panel-content {
	height: 100%;
}

.resize-handle {
	position: absolute;
	z-index: 10;
	touch-action: none;
}

.resize-handle--vertical {
	top: 0;
	bottom: 0;
	width: 6px;
	cursor: col-resize;
}

.resize-handle--east {
	right: -3px;
}

.resize-handle--west {
	left: -3px;
}

.resize-handle:hover,
.resize-handle:active {
	background: var(--color-fill-active);
}
</style>
