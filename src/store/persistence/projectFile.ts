import type { Store } from "../store";
import type { PersistedSessionState } from "../appSessionState.types";

export const PROJECT_SOURCE = 'CrossSectionPropertiesCalculator';
export const PROJECT_FILE_VERSION = 1;

/** The store groups that are saved to the project file (everything but `meta`) */
export type ProjectState = Omit<Store, 'meta'>;

export type ProjectFile = {
    meta: { source: typeof PROJECT_SOURCE; version: typeof PROJECT_FILE_VERSION };
    appSessionState: PersistedSessionState;
    state: ProjectState;
};
