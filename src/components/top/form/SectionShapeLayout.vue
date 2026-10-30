<script setup lang="ts">
defineProps<{}>();
</script>

<template>
	<div class="shape-layout">
		<div class="shape-layout__image">
			<slot name="preview">
			</slot>
		</div>
		<div class="shape-layout__fields">
			<slot />
		</div>
	</div>
</template>

<style scoped>
.shape-layout {
	display: grid;
	grid-template-columns: minmax(280px, 1.5fr) 1fr;
	gap: 20px;
	min-height: 224px;
	height: 100%;
}

.shape-layout__image {
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	background: var(--color-surface-canvas);
	border: 1px solid var(--color-border-subtle);
	border-radius: 8px;
	padding: 8px;
}

.shape-layout__image img {
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
}

.shape-layout__fields {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-template-rows: repeat(4, auto);
	align-content: start;
	gap: 10px;
}
</style>
