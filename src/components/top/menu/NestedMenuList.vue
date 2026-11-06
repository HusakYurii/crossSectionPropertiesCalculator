<script setup lang="ts">
import type { NestedMenuLevel } from './menu.types.ts';

defineProps<{
	level: NestedMenuLevel;
}>();
</script>

<template>
	<ul class="nav-menu">
		<li v-for="item in level.items" :key="item.value" class="nav-menu__entry">
			<button
				type="button"
				class="nav-menu__item"
				:disabled="item.disabled"
				:aria-haspopup="item.children ? 'menu' : undefined"
				@click="!item.children && level.onSelect(item.value)"
			>
				<span v-if="item.icon" class="nav-menu__icon" v-html="item.icon"></span>
				{{ item.label }}
				<span v-if="item.children" class="nav-menu__arrow">
					<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true">
						<path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</span>
			</button>
			<NestedMenuList v-if="item.children && !item.disabled" :level="item.children" />
		</li>
	</ul>
</template>

<style scoped>
.nav-menu {
	display: none;
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

.nav-menu__entry>.nav-menu {
	top: -1px;
	left: 100%;
}

.nav-menu__entry {
	position: relative;
}

.nav-menu__entry:hover>.nav-menu,
.nav-menu__entry:focus-within>.nav-menu {
	display: block;
}

.nav-menu__item {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	white-space: nowrap;
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

.nav-menu__entry:hover>.nav-menu__item:not(:disabled),
.nav-menu__entry:focus-within>.nav-menu__item:not(:disabled) {
	background-color: var(--color-fill-hover);
}

.nav-menu__item:disabled {
	opacity: 0.4;
	cursor: default;
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

.nav-menu__arrow {
	display: flex;
	align-items: center;
	margin-left: auto;
	flex-shrink: 0;
}
</style>
