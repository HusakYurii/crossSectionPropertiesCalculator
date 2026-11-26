<script setup lang="ts">
import undoIconRaw from '@/shared/assets/icons/undo.svg?raw';
import redoIconRaw from '@/shared/assets/icons/redo.svg?raw';
import QuickActionButton from './QuickActionButton.vue';

defineProps<{
	canUndo: boolean;
	canRedo: boolean;
}>();

defineEmits<{
	undo: [];
	redo: [];
}>();
</script>

<template>
	<QuickActionButton label="Undo" :icon="undoIconRaw" tooltip-side="bottom" :disabled="!canUndo" @click="$emit('undo')" />
	<QuickActionButton label="Redo" :icon="redoIconRaw" tooltip-side="bottom" :disabled="!canRedo" @click="$emit('redo')" />
</template>
