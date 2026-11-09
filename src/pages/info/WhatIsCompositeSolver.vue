<script setup lang="ts">
import { defineAsyncComponent  } from 'vue';
import InfoPanel from './InfoPanel.vue';
import Spinner from './Spinner.vue';
const CompositeSolver = defineAsyncComponent({
	loader: () => import('../../docs/composite_cross_section_properties_math.md'),
	loadingComponent: Spinner
});

</script>


<template>
	<InfoPanel topic="whatIsCompositeSolver">
		<CompositeSolver />
	</InfoPanel>
</template>
