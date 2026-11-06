<script setup lang="ts">
import CreateOrUpdateSectionDataModalWindow from './CreateOrUpdateSectionDataModalWindow.vue';
import { infoPanelState } from '../../store/infoPanel.ts';
import FilesMenu from './menu/FilesMenu.vue';
import EditMenu from './menu/EditMenu.vue';
import ShapesMenu from './menu/ShapesMenu.vue';
import HelpMenu from './menu/HelpMenu.vue';
</script>

<template>
	<header class="top-panel" :inert="infoPanelState.topic !== null">
		<FilesMenu />
		<EditMenu />
		<ShapesMenu />
		<HelpMenu />
	</header>

	<CreateOrUpdateSectionDataModalWindow />
</template>

<style scoped>
.top-panel {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 0;
	padding: 0;
	overflow: visible;
	background: var(--color-surface-chrome);
}
</style>
