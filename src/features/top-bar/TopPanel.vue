<script setup lang="ts">
import FilesMenu from './menu/FilesMenu.vue';
import EditMenu from './menu/EditMenu.vue';
import ShapesMenu from './menu/ShapesMenu.vue';
import HelpMenu from './menu/HelpMenu.vue';

defineProps<{inert: boolean}>()
</script>

<template>
	<header class="top-panel" :inert="inert">
		<FilesMenu />
		<EditMenu />
		<ShapesMenu />
		<HelpMenu />
	</header>
</template>

<style scoped>
.top-panel {
	flex-shrink: 0;
	display: flex;
	align-items: center;
	gap: 0;
	padding: 0;
	overflow: visible;
	background: var(--color-surface-top);
	border-bottom: 2px solid #e8e8e8;
}
</style>
