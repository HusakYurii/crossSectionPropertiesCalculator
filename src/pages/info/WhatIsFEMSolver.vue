<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import InfoPanel from './InfoPanel.vue';
import Spinner from './Spinner.vue';

// own chunk: the compiled doc carries ~190 KB of static KaTeX markup
const FemMath = defineAsyncComponent({
	loader: () => import('../../docs/fem_cross_section_properties_math.md'),
	loadingComponent: Spinner
});
</script>

<template>
	<InfoPanel topic="whatIsFEMSolver">
		<FemMath />
	</InfoPanel>
</template>
