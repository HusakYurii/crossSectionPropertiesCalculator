<script setup lang="ts">
import endpointIconRaw from '../assets/endpoint.svg?raw';
import objectSnapIconRaw from '../assets/object-snap.svg?raw';
import type { SnapOptionToggleKey } from '@/store/viewToggles.types';
import { appSessionState, toggleSnapOption } from '@/store/appSessionState';
import QuickToggleDropdown from '@/shared/components/quickActions/QuickToggleDropdown.vue';

// object snaps: a dropdown in the quick actions bar with toggles for the snaps of the main canvas
const SNAP_OPTION_CONFIG: Record<SnapOptionToggleKey, { label: string; icon: string }> = {
	endpoint: { label: 'Endpoint', icon: endpointIconRaw },
};
const SNAP_OPTIONS = (Object.keys(SNAP_OPTION_CONFIG) as SnapOptionToggleKey[])
	.map((key) => ({ key, ...SNAP_OPTION_CONFIG[key] }));
</script>

<template>
	<QuickToggleDropdown label="Object snap options" :icon="objectSnapIconRaw" :options="SNAP_OPTIONS"
		:toggles="appSessionState.snapOptionsToggles" @toggle="toggleSnapOption" />
</template>
