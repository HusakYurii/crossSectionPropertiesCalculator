<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import InfoPanel from './InfoPanel.vue';
import Spinner from './Spinner.vue';

// loaded only when the panel is opened, in its own chunk
const NavigationAndShortcuts = defineAsyncComponent({
	loader: () => import('../../docs/navigation_and_shortcuts.md'),
	loadingComponent: Spinner
});
</script>

<template>
	<InfoPanel topic="navigationAndShortcuts">
		<NavigationAndShortcuts />
	</InfoPanel>
</template>
