/** the object snaps of the main canvas; add a key here and the compiler points at every place that needs it */
export type SnapOptionToggleKey = 'endpoint';

export type SnapOptionsToggles = Record<SnapOptionToggleKey, boolean>;

export const DEFAULT_SNAP_OPTIONS_TOGGLES: SnapOptionsToggles = { endpoint: false };

export const anySnapOptionToggleOn = (toggles: SnapOptionsToggles): boolean => Object.values(toggles).some(Boolean);
