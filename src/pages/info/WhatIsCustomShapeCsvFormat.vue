<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import InfoPanel from './InfoPanel.vue';
import Spinner from './Spinner.vue';

// loaded only when the panel is opened, in its own chunk
const CsvFormat = defineAsyncComponent({
	loader: () => import('../../docs/custom_shape_csv_format.md'),
	loadingComponent: Spinner
});
</script>

<template>
	<InfoPanel topic="whatIsCustomShapeCsvFormat">
		<CsvFormat />
	</InfoPanel>
</template>
