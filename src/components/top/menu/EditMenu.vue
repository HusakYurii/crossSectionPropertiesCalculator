<script setup lang="ts">
import { computed } from 'vue';
import MenuWithDropDown from './MenuWithDropDown.vue';
import type { MenuItem } from './menu.types.ts';
import { history } from '../../../store/history.ts';
import undoIconRaw from '../../../svg/undo.svg?raw';
import redoIconRaw from '../../../svg/redo.svg?raw';

type EditActionNames = 'undo' | 'redo';

const EDIT_ITEMS = computed<MenuItem<EditActionNames>[]>(() => [
	{ value: 'undo', label: 'Undo', icon: undoIconRaw, disabled: !history.canUndo.value },
	{ value: 'redo', label: 'Redo', icon: redoIconRaw, disabled: !history.canRedo.value },
]);

function onEditSelect(action: EditActionNames) {
	if (action === 'undo') history.undo();
	else history.redo();
}
</script>

<template>
	<MenuWithDropDown title="Edit" :items="EDIT_ITEMS" @select="onEditSelect" />
</template>
