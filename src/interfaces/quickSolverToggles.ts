/** the toggles of the solver quick actions; add a key here and the compiler points at every place that needs it */
export type QuickSolverToggleKey = 'centroid' | 'principalAxes' | 'gyration';

export type QuickSolverToggles = Record<QuickSolverToggleKey, boolean>;

export const DEFAULT_QUICK_SOLVER_TOGGLES: QuickSolverToggles = { centroid: false, principalAxes: false, gyration: false };

export const anyQuickSolverToggleOn = (toggles: QuickSolverToggles): boolean => Object.values(toggles).some(Boolean);
