<script setup lang="ts">
import hatchIconRaw from '../assets/hatch.svg?raw';
import { appSessionState, setShowHatching } from '@/store/appSessionState';
import QuickActionButton from '@/shared/components/quickActions/QuickActionButton.vue';
</script>

<template>
	<QuickActionButton label="Hatching" :icon="hatchIconRaw" :active="appSessionState.showHatching" tooltip-side="bottom"
		@click="setShowHatching(!appSessionState.showHatching)" />
</template>
