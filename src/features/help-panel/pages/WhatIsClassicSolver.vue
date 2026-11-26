<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import InfoPanel from '../InfoPanel.vue';
import Spinner from '@/shared/components/Spinner.vue';

const ClassicMath = defineAsyncComponent({
	loader: () => import('../docs/standard_cross_section_properties_math.md'),
	loadingComponent: Spinner
});
</script>

<template>
	<InfoPanel topic="whatIsClassicSolver">
		<ClassicMath />
	</InfoPanel>
</template>
