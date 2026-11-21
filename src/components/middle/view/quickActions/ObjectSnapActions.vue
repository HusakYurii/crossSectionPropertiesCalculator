<script setup lang="ts">
import endpointIconRaw from '../../../../svg/endpoint.svg?raw';
import objectSnapIconRaw from '../../../../svg/object-snap.svg?raw';
import type { SnapOptionToggleKey } from '../../../../interfaces/snapOptionsToggles';
import { appSessionState, toggleSnapOption } from '../../../../store/appSessionState';
import QuickToggleDropdown from './QuickToggleDropdown.vue';

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
