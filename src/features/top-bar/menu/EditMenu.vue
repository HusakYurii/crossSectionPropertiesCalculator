<script setup lang="ts">
import { computed } from 'vue';
import MenuWithDropDown from './components/MenuWithDropDown.vue';
import type { MenuItem } from './menu.types';
import { history } from '@/store/history';
import { appSessionState } from '@/store/appSessionState';
import { copySelectedShape, duplicateSelectedShape, hasClipboard, pasteShape } from '@/store/shapeClipboard';
import { nativeHotKeysService } from '@/shared/services/hotkeys/NativeHotKeysService';
import undoIconRaw from '@/shared/assets/icons/undo.svg?raw';
import redoIconRaw from '@/shared/assets/icons/redo.svg?raw';

type EditActionNames = 'undo' | 'redo' | 'copy' | 'paste' | 'duplicate';

const hasSelection = computed(() => appSessionState.currentSelectedShapeID !== null);

const EDIT_ITEMS = computed<MenuItem<EditActionNames>[]>(() => [
	{ value: 'undo', label: 'Undo', shortcut: nativeHotKeysService.getLabel('undo'), icon: undoIconRaw, disabled: !history.canUndo.value },
	{ value: 'redo', label: 'Redo', shortcut: nativeHotKeysService.getLabel('redo'), icon: redoIconRaw, disabled: !history.canRedo.value },
	{ value: 'copy', label: 'Copy', shortcut: nativeHotKeysService.getLabel('copy'), disabled: !hasSelection.value },
	{ value: 'paste', label: 'Paste', shortcut: nativeHotKeysService.getLabel('paste'), disabled: !hasClipboard.value },
	{ value: 'duplicate', label: 'Duplicate', shortcut: nativeHotKeysService.getLabel('duplicate'), disabled: !hasSelection.value },
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
