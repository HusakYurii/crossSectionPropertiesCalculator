/** the toggles of the solver quick actions; add a key here and the compiler points at every place that needs it */
export type QuickSolverToggleKey = 'centroid' | 'principalAxes' | 'gyration';

export type QuickSolverToggles = Record<QuickSolverToggleKey, boolean>;

/** the object snaps of the main canvas; add a key here and the compiler points at every place that needs it */
export type SnapOptionToggleKey = 'endpoint';

export type SnapOptionsToggles = Record<SnapOptionToggleKey, boolean>;
