import { onMounted, onUnmounted } from 'vue';
import { nativeHotKeysService } from '@/shared/services/hotkeys/NativeHotKeysService';
import type { HotKeyHandler, HotKeyId, HotKeyOptions } from '@/shared/services/hotkeys/NativeHotKeysService.types';

/** Subscribes to an app shortcut while the component is mounted */
export const useHotKey = (id: HotKeyId, handler: HotKeyHandler, options?: HotKeyOptions) => {
	let unsubscribe: (() => void) | null = null;
	onMounted(() => {
		unsubscribe = nativeHotKeysService.on(id, handler, options);
	});
	onUnmounted(() => {
		unsubscribe && unsubscribe();
		unsubscribe = null;
	});
}
