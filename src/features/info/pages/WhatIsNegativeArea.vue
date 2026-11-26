<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import InfoPanel from '../InfoPanel.vue';
import Spinner from '@/shared/components/Spinner.vue';

const NegativeArea = defineAsyncComponent({
	loader: () => import('../docs/negative_area.md'),
	loadingComponent: Spinner
});
</script>

<template>
	<InfoPanel topic="whatIsNegativeArea">
		<NegativeArea />
	</InfoPanel>
</template>
