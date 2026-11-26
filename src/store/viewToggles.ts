import type { QuickSolverToggles, SnapOptionsToggles } from './viewToggles.types';

export const DEFAULT_QUICK_SOLVER_TOGGLES: QuickSolverToggles = { centroid: false, principalAxes: false, gyration: false };

export const anyQuickSolverToggleOn = (toggles: QuickSolverToggles): boolean => Object.values(toggles).some(Boolean);

export const DEFAULT_SNAP_OPTIONS_TOGGLES: SnapOptionsToggles = { endpoint: false };

export const anySnapOptionToggleOn = (toggles: SnapOptionsToggles): boolean => Object.values(toggles).some(Boolean);
