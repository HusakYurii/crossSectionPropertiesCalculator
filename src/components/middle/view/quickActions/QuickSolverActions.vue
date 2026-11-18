<script setup lang="ts">
import { onUnmounted, ref, useId, watch } from 'vue';
import centroidIconRaw from '../../../../svg/centroid.svg?raw';
import principalAxesIconRaw from '../../../../svg/principal-axes.svg?raw';
import gyrationIconRaw from '../../../../svg/gyration.svg?raw';
import overlaysLayersIconRaw from '../../../../svg/overlays-layers.svg?raw';
import { anyQuickSolverToggleOn, type QuickSolverToggleKey, type QuickSolverToggles } from '../../../../interfaces/quickSolverToggles';

defineProps<{
	toggles: QuickSolverToggles;
}>();

const emit = defineEmits<{
	toggle: [key: QuickSolverToggleKey];
}>();

// solver actions: a dropdown in the quick actions bar with toggles for what the whole section shows on the canvas
const SOLVER_ACTION_CONFIG: Record<QuickSolverToggleKey, { label: string; icon: string }> = {
	centroid: { label: 'Section centroid', icon: centroidIconRaw },
	principalAxes: { label: 'Principal axes', icon: principalAxesIconRaw },
	gyration: { label: 'Radius of gyration', icon: gyrationIconRaw },
};
const SOLVER_ACTIONS = (Object.keys(SOLVER_ACTION_CONFIG) as QuickSolverToggleKey[])
	.map((key) => ({ key, ...SOLVER_ACTION_CONFIG[key] }));


const listId = useId();
const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);

const isInside = (target: EventTarget | null) => target instanceof Node && !!rootRef.value?.contains(target);

// a press anywhere else closes the list; never prevented, so a click on the canvas still acts on the canvas
function onDocumentPointerDown(event: PointerEvent) {
	if (!isInside(event.target)) {
		open.value = false;
	}
}

function onDocumentKeyDown(event: KeyboardEvent) {
	if (event.key !== 'Escape') {
		return;
	}
	// only when the focus is here (or nowhere), so Escape elsewhere keeps its own meaning
	const active = document.activeElement;
	if (!isInside(active) && active !== document.body) {
		return;
	}
	event.stopPropagation();
	open.value = false;
	triggerRef.value?.focus();
}

// tabbing away leaves the list open otherwise
function onFocusOut(event: FocusEvent) {
	if (open.value && event.relatedTarget && !isInside(event.relatedTarget)) {
		open.value = false;
	}
}

function removeListeners() {
	document.removeEventListener('pointerdown', onDocumentPointerDown, { capture: true });
	document.removeEventListener('keydown', onDocumentKeyDown);
}

watch(open, (isOpen) => {
	removeListeners();
	if (isOpen) {
		document.addEventListener('pointerdown', onDocumentPointerDown, { capture: true });
		document.addEventListener('keydown', onDocumentKeyDown);
	}
});

onUnmounted(removeListeners);
</script>

<template>
	<div ref="rootRef" class="quick-solver-actions" @focusout="onFocusOut">
		<button ref="triggerRef" type="button" class="quick-solver-actions__trigger"
			:class="{ 'is-active': anyQuickSolverToggleOn(toggles), 'is-open': open }" data-tooltip="Solver preview options" aria-label="Solver preview options"
			:aria-expanded="open" :aria-controls="open ? listId : undefined" @click="open = !open">
			<span class="quick-solver-actions__icon" v-html="overlaysLayersIconRaw"></span>
			<span class="quick-solver-actions__chevron"></span>
		</button>
		<ul v-if="open" :id="listId" class="quick-solver-actions__list">
			<li v-for="action in SOLVER_ACTIONS" :key="action.key">
				<button type="button" class="quick-solver-actions__option" :class="{ 'is-checked': toggles[action.key] }"
					:aria-pressed="toggles[action.key]" @click="emit('toggle', action.key)">
					<span class="quick-solver-actions__icon" v-html="action.icon"></span>
					<span>{{ action.label }}</span>
				</button>
			</li>
		</ul>
	</div>
</template>

<style scoped>
/* one 26 px tall control: the icon and the chevron; the list drops down below it */
.quick-solver-actions {
	position: relative;
	display: flex;
	height: 26px;
}

.quick-solver-actions__trigger {
	position: relative;
	display: flex;
	align-items: center;
	height: 26px;
	padding: 0;
	border: 1px solid var(--color-border-subtle);
	border-radius: 0;
	background: var(--color-surface-chrome);
	color: var(--color-text);
	cursor: pointer;
}

/* the light fills of the snap list: hover, and a toggle that is on or a list that is open;
   focus-visible too, because the global reset removes the outline */
.quick-solver-actions__trigger:is(:hover, :focus-visible) {
	background: var(--color-fill-hover);
}

.quick-solver-actions__trigger.is-active,
.quick-solver-actions__trigger.is-open {
	background: var(--color-fill-active);
}

.quick-solver-actions__icon {
	display: block;
	flex: none;
	width: 16px;
	height: 16px;
}

/* the icon is centered in a 24 px inner cell (26 px with the border), like the other buttons of the bar */
.quick-solver-actions__trigger > .quick-solver-actions__icon {
	box-sizing: content-box;
	padding: 0 4px;
}

/* the chevron cell, set apart by a thin line; the chevron itself is drawn like the one of the snap select */
.quick-solver-actions__chevron {
	position: relative;
	align-self: stretch;
	width: 18px;
	border-left: 1px solid var(--color-border-subtle);
}

.quick-solver-actions__chevron::after {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 5px;
	height: 5px;
	margin-left: -3px;
	border-right: 1.5px solid currentColor;
	border-bottom: 1.5px solid currentColor;
	transform: translateY(-70%) rotate(45deg);
}

/* the tooltip, drawn like the one of QuickActionButton (bottom side); not shown while the list is open,
   since the list drops down where the tooltip would be */
.quick-solver-actions__trigger::after {
	content: attr(data-tooltip);
	position: absolute;
	top: calc(100% + 6px);
	left: 50%;
	z-index: 2;
	padding: 4px 8px;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-chrome);
	box-shadow: 0 2px 6px var(--color-shadow);
	color: var(--color-text);
	font-size: 12px;
	white-space: nowrap;
	pointer-events: none;
	opacity: 0;
	transform: translateX(-50%);
	/* leaving is instant, so a tooltip never lingers over the canvas */
	transition: opacity 0.08s ease 0s;
}

.quick-solver-actions__trigger:not(.is-open):is(:hover, :focus-visible)::after {
	opacity: 1;
	/* the 100 ms wait before it shows, so moving the mouse across the bar does not flash it */
	transition-delay: 0.1s;
}

/* chevron flips while the list is open */
.quick-solver-actions__trigger.is-open .quick-solver-actions__chevron::after {
	transform: translateY(-30%) rotate(225deg);
}

/* the list: shares the bottom border of the trigger, same surface as the snap list; its left edge is on the
   trigger and it opens to the right, like the snap list */
.quick-solver-actions__list {
	position: absolute;
	top: 100%;
	left: 0;
	z-index: 3;
	min-width: 100%;
	margin: -1px 0 0;
	padding: 0;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-chrome);
	box-shadow: 0 4px 12px var(--color-shadow);
	list-style: none;
	white-space: nowrap;
}

.quick-solver-actions__option {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 6px 8px;
	border: none;
	border-radius: 0;
	background: transparent;
	color: var(--color-text);
	font-size: 12px;
	text-align: left;
	cursor: pointer;
	transition: background-color 0.35s;
}

/* a thin line between the options, so they stay apart when several are on */
.quick-solver-actions__list > li + li {
	border-top: 1px solid var(--color-border-subtle);
}

.quick-solver-actions__option:is(:hover, :focus-visible) {
	background: var(--color-fill-hover);
	outline: none;
}

/* an option that is on: the light accent of a selected shape in the left panel, not a gray that reads as hover;
   no bold, so the list keeps its width */
.quick-solver-actions__option.is-checked {
	background: var(--color-accent-selected);
}

.quick-solver-actions__option.is-checked:is(:hover, :focus-visible) {
	background: var(--color-accent-selected-hover);
}

.quick-solver-actions__icon :deep(svg) {
	display: block;
	width: 100%;
	height: 100%;
}

.quick-solver-actions__icon :deep(path:not(.icon-fill)),
.quick-solver-actions__icon :deep(circle) {
	stroke: currentColor;
}

/* the filled parts of an icon follow the text color like the strokes do, and have no outline of their own */
.quick-solver-actions__icon :deep(.icon-fill) {
	fill: currentColor;
	stroke: none;
}
</style>
