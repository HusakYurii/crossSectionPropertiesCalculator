<script setup lang="ts" generic="T extends string">
import NestedMenuList from './NestedMenuList.vue';
import type { NestedMenuLevel } from './menu.types.ts';

defineProps<{
	title: string;
	level: NestedMenuLevel<T>;
}>();
</script>

<template>
	<div class="nav-item">
		<button type="button" class="nav-button">
			{{ title }}
		</button>
		<NestedMenuList :level="level" />
	</div>
</template>

<style scoped>
.nav-item {
	position: relative;
	height: 100%;
	display: flex;
	align-items: center;
}

.nav-item:hover>.nav-button,
.nav-item:focus-within>.nav-button {
	background-color: var(--color-fill-hover);
}

.nav-item:hover>.nav-menu,
.nav-item:focus-within>.nav-menu {
	display: block;
}

.nav-button {
	height: 100%;
	padding: 10px 16px;
	border: none;
	background-color: transparent;
	color: var(--color-text);
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.02em;
	text-transform: uppercase;
	cursor: pointer;
	transition: background-color 0.35s;
}
</style>
