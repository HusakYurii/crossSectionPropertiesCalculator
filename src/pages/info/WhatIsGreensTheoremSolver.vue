<script setup lang="ts">
import { defineAsyncComponent } from 'vue';
import InfoPanel from './InfoPanel.vue';
import Spinner from './Spinner.vue';

const GreenTheoremMath = defineAsyncComponent({
	loader: () => import('../../docs/green_theorem_cross_section_properties_math.md'),
	loadingComponent: Spinner
});

</script>


<template>
	<InfoPanel topic="whatIsGreensTheoremSolver">
		<GreenTheoremMath />
	</InfoPanel>
</template>
