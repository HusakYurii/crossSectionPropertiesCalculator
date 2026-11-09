<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import InfoPanel from './InfoPanel.vue';
import Spinner from './Spinner.vue';

const AboutApp = defineAsyncComponent({
	loader: () => import('../../docs/about_app.md'),
	loadingComponent: Spinner
});
</script>

<template>
	<InfoPanel topic="aboutThisApp">
		<AboutApp />
	</InfoPanel>
</template>
