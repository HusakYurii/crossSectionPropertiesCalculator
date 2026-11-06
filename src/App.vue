<script setup lang="ts">
import TopPanel from './components/top/TopPanel.vue';
import LeftPanel from './components/left/LeftPanel.vue';
import View from './components/middle/view/View.vue';
import RightPanel from './components/right/RightPanel.vue';
import InfoPanels from './pages/info/InfoPanels.vue';
import { infoPanelState } from './store/infoPanel.ts';
import { useHistoryShortcuts } from './composables/useHistoryShortcuts.ts';
import { useEditorPanelsResize, RESIZE_TARGETS } from './composables/useEditorPanelsResize.ts';

useHistoryShortcuts();

const {
	leftWidth,
	rightWidth,
	startResize
} = useEditorPanelsResize();

</script>

<template>
	<div class="app">
		<TopPanel :inert="infoPanelState.topic !== null" />

		<div class="app-body" :inert="infoPanelState.topic !== null">
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

			<div class="panel-slot panel-slot--right" :style="{ width: `${rightWidth}px` }">
				<div class="resize-handle resize-handle--vertical resize-handle--west" aria-hidden="true"
					@mousedown="startResize(RESIZE_TARGETS.RIGHT, $event)" />
				<RightPanel class="panel-content" />
			</div>
		</div>

		<div class="modals-container" :inert="infoPanelState.topic !== null"></div>
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
