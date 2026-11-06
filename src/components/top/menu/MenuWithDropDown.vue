<script setup lang="ts" generic="T extends string">
import type { MenuItem } from './menu.types.ts';

defineProps<{
	title: string;
	items: MenuItem<T>[];
}>();

const emit = defineEmits<{
	select: [value: T];
}>();
</script>

<template>
	<div class="nav-item">
		<button type="button" class="nav-button">
			{{ title }}
		</button>
		<ul class="nav-menu hidden">
			<li v-for="item in items" :key="item.value">
				<button
					type="button"
					class="nav-menu__item"
					:class="{ 'nav-menu__item--with-icon': item.icon }"
					:disabled="item.disabled"
					@click="emit('select', item.value)"
				>
					<span v-if="item.icon" class="nav-menu__icon" v-html="item.icon"></span>
					{{ item.label }}
				</button>
			</li>
		</ul>
	</div>
</template>

<style scoped>
.nav-item {
	position: relative;
	height: 100%;
	display: flex;
	align-items: center;
}

.nav-item:hover>.nav-button {
	background-color: var(--color-fill-hover);
}

.nav-item:hover>.nav-menu {
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


.nav-menu {
	position: absolute;
	top: 100%;
	left: 0;
	z-index: 20;
	min-width: 180px;
	margin: 0;
	padding: 0;
	list-style: none;
	background-color: var(--color-surface-chrome);
	border: 1px solid var(--color-border-subtle);
	border-radius: 0;
	box-shadow: 0 4px 12px var(--color-shadow);
}

.nav-menu.hidden {
	display: none;
}

.nav-menu__item {
	width: 100%;
	padding: 8px 12px;
	border: none;
	border-radius: 0;
	background-color: transparent;
	color: var(--color-text);
	font-size: 14px;
	text-align: left;
	cursor: pointer;
	transition: background-color 0.35s;
}

.nav-menu__item:hover:not(:disabled) {
	background-color: var(--color-fill-hover);
}

.nav-menu__item:disabled {
	opacity: 0.4;
	cursor: default;
}

.nav-menu__item--with-icon {
	display: flex;
	align-items: center;
	gap: 8px;
}

.nav-menu__icon {
	flex-shrink: 0;
	width: 18px;
	height: 18px;
}

.nav-menu__icon :deep(svg) {
	display: block;
	width: 100%;
	height: 100%;
}

.nav-menu__icon :deep(path) {
	stroke: currentColor;
}
</style>
