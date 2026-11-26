<script setup lang="ts">
import ConfirmSaveFileModal from '@/shared/components/modals/ConfirmSaveFileModal.vue';

const props = defineProps<{
	initialName?: string;
	/** called with the trimmed, non-empty name */
	onConfirm: (name: string) => void;
	onReject: () => void;
}>();
</script>

<template>
	<ConfirmSaveFileModal title="Export CSV" extension="csv" :initial-name="props.initialName"
		:on-confirm="props.onConfirm" :on-reject="props.onReject" />
</template>
