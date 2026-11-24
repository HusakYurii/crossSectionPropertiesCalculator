// not in the TS lib types yet (Chromium only)
type NavigatorWithUserAgentData = Navigator & {
	userAgentData?: { platform?: string };
};

const MAC_PATTERN = /mac|iphone|ipad|ipod/i;
// "Windows", "Win32", "Windows NT"; the word start keeps "Darwin" (some Mac user agents) out
const WINDOWS_PATTERN = /\bwin/i;

/** Detects the OS once; it decides the keyboard layout of the labels (Mac: ⌘/⌥/⇧, the rest: Ctrl/Alt/Shift) */
export class OperatingSystemService {
	private _platform: string = ''

	constructor() {
		if (typeof navigator === 'undefined') {
			this._platform = '';
		}
		else {
			const nav = navigator as NavigatorWithUserAgentData;
			this._platform = nav.userAgentData?.platform || nav.platform || nav.userAgent || '';
		}
	}

	// iPadOS reports MacIntel and uses the Mac shortcuts, so it counts as Mac
	isMacOS(): boolean {
		return MAC_PATTERN.test(this._platform);
	}

	isWindowsOS(): boolean {
		return WINDOWS_PATTERN.test(this._platform);
	}
}

// Linux is neither Mac nor Windows: it uses the Windows-style labels (Ctrl/Alt/Shift)
export const operatingSystemService = new OperatingSystemService();
