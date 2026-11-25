import type { HotKeyId } from '../services/singletons/NativeHotKeysService.ts';

export const MAC_HOT_KEYS_LABELS: Record<HotKeyId, string> = {
	undo: '⌘Z',
	redo: '⇧⌘Z',
	copy: '⌘C',
	paste: '⌘V',
	duplicate: '⌘D',
};

export const WINDOWS_HOT_KEYS_LABELS: Record<HotKeyId, string> = {
	undo: 'Ctrl+Z',
	redo: 'Ctrl+Shift+Z',
	copy: 'Ctrl+C',
	paste: 'Ctrl+V',
	duplicate: 'Ctrl+D',
};
