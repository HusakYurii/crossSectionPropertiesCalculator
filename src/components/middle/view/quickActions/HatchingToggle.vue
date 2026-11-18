<script setup lang="ts">
import hatchIconRaw from '../../../../svg/hatch.svg?raw';
import { appSessionState, setShowHatching } from '../../../../store/appSessionState';
import QuickActionButton from './QuickActionButton.vue';
</script>

<template>
	<QuickActionButton label="Hatching" :icon="hatchIconRaw" :active="appSessionState.showHatching" tooltip-side="bottom"
		@click="setShowHatching(!appSessionState.showHatching)" />
</template>
