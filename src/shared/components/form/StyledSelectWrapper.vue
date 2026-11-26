<script setup lang="ts">
// shared look of the app's selects: wraps a slotted <select>. Sizing (height, radius, min width) stays with the parent
</script>

<template>
	<span class="styled-select">
		<slot />
	</span>
</template>

<style scoped>
.styled-select {
	position: relative;
	display: flex;
}

/* the chevron; drawn here because appearance: none removes the native one */
.styled-select::after {
	content: '';
	position: absolute;
	top: 50%;
	right: 9px;
	width: 5px;
	height: 5px;
	border-right: 1.5px solid currentColor;
	border-bottom: 1.5px solid currentColor;
	color: var(--color-text);
	pointer-events: none;
	transform: translateY(-70%) rotate(45deg);
}

:slotted(select) {
	padding: 0 24px 0 8px;
	border: 1px solid var(--color-border-subtle);
	background: var(--color-surface-chrome);
	color: var(--color-text);
	font-size: 12px;
	cursor: pointer;
	appearance: none;
}

/* Chromium's customizable select: the list drops down below the control and matches its look.
   Other browsers keep the native list (the rules above) */
@supports (appearance: base-select) {
	/* keep the hand-drawn chevron on the wrapper */
	:slotted(select)::picker-icon {
		display: none;
	}

	:slotted(select) {
		appearance: base-select;
		/* base-select lays the button out as a box with its own block padding; center the label in the fixed height */
		display: inline-flex;
		align-items: center;
		padding-block: 0;
		line-height: normal;
	}

	/* the list: drops down from the select, same surface as the control and the nav menus */
	:slotted(select)::picker(select) {
		appearance: base-select;
		position-area: block-end span-inline-end;
		position-try-fallbacks: flip-block, flip-inline;
		min-inline-size: anchor-size(self-inline);
		margin: 0;
		margin-block-start: -1px; /* shares the select's bottom border */
		padding: 0;
		border: 1px solid var(--color-border-subtle);
		background: var(--color-surface-chrome);
		box-shadow: 0 4px 12px var(--color-shadow);
	}

	:slotted(select) option {
		padding: 6px 8px;
		background: transparent;
		cursor: pointer;
		transition: background-color 0.35s;
	}

	:slotted(select) option::checkmark {
		display: none;
	}

	:slotted(select) option:checked {
		background: var(--color-fill-active);
		font-weight: 600;
	}

	/* after :checked so hovering the current option still shows */
	:slotted(select) option:is(:hover, :focus-visible) {
		background: var(--color-fill-hover);
		outline: none;
	}

	/* chevron flips while the list is open */
	.styled-select:has(select:open)::after {
		transform: translateY(-30%) rotate(225deg);
	}
}
</style>
