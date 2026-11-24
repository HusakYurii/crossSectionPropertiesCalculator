<script setup lang="ts">
import { computed } from 'vue';
import MenuWithDropDown from './MenuWithDropDown.vue';
import type { MenuItem } from '../../../interfaces/menu/menu.types.ts';
import { history } from '../../../store/history.ts';
import { appSessionState } from '../../../store/appSessionState.ts';
import { copySelectedShape, duplicateSelectedShape, hasClipboard, pasteShape } from '../../../store/shapeClipboard.ts';
import undoIconRaw from '../../../svg/undo.svg?raw';
import redoIconRaw from '../../../svg/redo.svg?raw';

type EditActionNames = 'undo' | 'redo' | 'copy' | 'paste' | 'duplicate';

const hasSelection = computed(() => appSessionState.currentSelectedShapeID !== null);

const EDIT_ITEMS = computed<MenuItem<EditActionNames>[]>(() => [
	{ value: 'undo', label: 'Undo', icon: undoIconRaw, disabled: !history.canUndo.value },
	{ value: 'redo', label: 'Redo', icon: redoIconRaw, disabled: !history.canRedo.value },
	{ value: 'copy', label: 'Copy', disabled: !hasSelection.value },
	{ value: 'paste', label: 'Paste', disabled: !hasClipboard.value },
	{ value: 'duplicate', label: 'Duplicate', disabled: !hasSelection.value },
]);

function onEditSelect(action: EditActionNames) {
	if (action === 'undo') history.undo();
	else if (action === 'redo') history.redo();
	else if (action === 'copy') copySelectedShape();
	else if (action === 'paste') pasteShape();
	else duplicateSelectedShape();
}
</script>

<template>
	<MenuWithDropDown title="Edit" :items="EDIT_ITEMS" @select="onEditSelect" />
</template>
