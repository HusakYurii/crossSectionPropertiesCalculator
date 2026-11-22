<script setup lang="ts" generic="T extends string">
import NestedMenuList from './NestedMenuList.vue';
import type { NestedMenuLevel } from '../../../interfaces/menu/menu.types.ts';

import { ref } from 'vue';

defineProps<{
	title: string;
	level: NestedMenuLevel<T>;
}>();

const isClosed = ref(false);
</script>

<template>
	<div class="nav-item" :class="{ 'nav-item--closed': isClosed }" @mouseleave="isClosed = false">
		<button type="button" class="nav-button" @click="isClosed = false">
			{{ title }}
		</button>
		<NestedMenuList :level="level" @picked="isClosed = true" />
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

.nav-item:not(.nav-item--closed):hover>.nav-menu,
.nav-item:not(.nav-item--closed):focus-within>.nav-menu {
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
