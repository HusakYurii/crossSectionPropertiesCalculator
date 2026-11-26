<script setup lang="ts">
import ConfirmSaveFileModal from '@/shared/components/modals/ConfirmSaveFileModal.vue';
import { DEFAULT_PROJECT_FILE_NAME } from '@/store/persistence/storeDataExporter';

const props = defineProps<{
	/** called with the trimmed, non-empty name */
	onConfirm: (name: string) => void;
	onReject: () => void;
}>();
</script>

<template>
	<ConfirmSaveFileModal title="Export Project" extension="json" :initial-name="DEFAULT_PROJECT_FILE_NAME"
		:on-confirm="props.onConfirm" :on-reject="props.onReject" />
</template>
