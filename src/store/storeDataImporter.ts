import { markRaw } from 'vue';
import { toast } from 'vue3-toastify';
import { PROJECT_SOURCE, type ProjectState } from "./projectFile";
import { history } from "./history";
import { DEFAULT_QUICK_SOLVER_TOGGLES, type QuickSolverToggles } from "../interfaces/quickSolverToggles";
import { resetStore, store } from "./store";
import { appSessionState, markStateDirty, type DimensionLabelOffsetKey, type PersistedSessionState } from "./appSessionState";

type NormalizedProject = {
    state: ProjectState;
    session: PersistedSessionState;
};

const isRecord = (value: unknown): value is Record<string, any> => {
    return value !== null && typeof value === 'object';
}

const isStoreDataValid = (data: unknown): data is Record<string, any> => {
    return isRecord(data) && isRecord(data.meta) && data.meta.source === PROJECT_SOURCE;
}

/** only the known keys with a boolean value are taken, the rest stay at their defaults */
const sanitizeToggles = (value: unknown): QuickSolverToggles => {
    const toggles = { ...DEFAULT_QUICK_SOLVER_TOGGLES };
    if (isRecord(value)) {
        for (const key of Object.keys(toggles) as (keyof QuickSolverToggles)[]) {
            if (typeof value[key] === 'boolean') {
                toggles[key] = value[key];
            }
        }
    }
    return toggles;
}

const OFFSET_KEYS: DimensionLabelOffsetKey[] = ['x', 'y', 'xAlong', 'yAlong'];

/** the known keys with a finite number; an x / y of 0 is no offset (the same rule as the store) */
const sanitizeLabelOffsets = (value: unknown): Partial<Record<DimensionLabelOffsetKey, number>> => {
    const offsets: Partial<Record<DimensionLabelOffsetKey, number>> = {};
    if (!isRecord(value) || Array.isArray(value)) {
        return offsets;
    }
    for (const key of OFFSET_KEYS) {
        const offset = value[key];
        if (Number.isFinite(offset) && !(offset === 0 && (key === 'x' || key === 'y'))) {
            offsets[key] = offset;
        }
    }
    return offsets;
}

/** the offsets of every shape, each sanitised; a shape left with none is dropped */
const sanitizeShapeLabelOffsets = (value: unknown): PersistedSessionState['dimensionLabelOffsets'] => {
    const result: PersistedSessionState['dimensionLabelOffsets'] = {};
    if (!isRecord(value) || Array.isArray(value)) {
        return result;
    }
    for (const uid of Object.keys(value)) {
        const offsets = sanitizeLabelOffsets(value[uid]);
        if (Object.keys(offsets).length > 0) {
            result[uid] = offsets;
        }
    }
    return result;
}

/** Turns a supported file version into the current shape, undefined if the version is unknown */
const normalizeProject = (data: Record<string, any>): NormalizedProject | undefined => {
    if (data.meta.version === 2) {
        return {
            state: data.state ?? {},
            session: {
                showRotationFor: data.appSessionState?.showRotationFor ?? {},
                dimensionLabelOffsets: sanitizeShapeLabelOffsets(data.appSessionState?.dimensionLabelOffsets),
                quickSolverToggles: sanitizeToggles(data.appSessionState?.quickSolverToggles),
                compositeLabelOffsets: sanitizeLabelOffsets(data.appSessionState?.compositeLabelOffsets),
            },
        };
    }
    if (data.meta.version === 1) {
        // legacy file: the flat store itself, there is no session state in it
        const { meta: _meta, ...state } = data;
        return { state: state as ProjectState, session: { showRotationFor: {}, dimensionLabelOffsets: {}, quickSolverToggles: { ...DEFAULT_QUICK_SOLVER_TOGGLES }, compositeLabelOffsets: {} } };
    }
    return undefined;
}

const replaceStoreData = (state: Partial<ProjectState>) => {
    resetStore();
    Object.assign(store.geometry, state.geometry);
    Object.assign(store.geometryExtra, state.geometryExtra);
    Object.assign(store.crossSectionProperties, state.crossSectionProperties);
    Object.assign(store.crossSectionPolygon, state.crossSectionPolygon);
    // meshes are never edited in place, keep them raw as setCrossSectionMesh does
    for (const uid in state.crossSectionMesh) {
        store.crossSectionMesh[uid] = markRaw(state.crossSectionMesh[uid]);
    }
}

const replaceAppSessionData = (session: PersistedSessionState) => {
    for (const key of Object.keys(appSessionState.showRotationFor)) {
        delete appSessionState.showRotationFor[key];
    }
    for (const key of Object.keys(appSessionState.dimensionLabelOffsets)) {
        delete appSessionState.dimensionLabelOffsets[key];
    }
    for (const key of Object.keys(appSessionState.compositeLabelOffsets)) {
        delete appSessionState.compositeLabelOffsets[key as DimensionLabelOffsetKey];
    }
    Object.assign(appSessionState.showRotationFor, session.showRotationFor);
    Object.assign(appSessionState.dimensionLabelOffsets, session.dimensionLabelOffsets);
    Object.assign(appSessionState.quickSolverToggles, session.quickSolverToggles);
    Object.assign(appSessionState.compositeLabelOffsets, session.compositeLabelOffsets);
    // redrawId is left alone, markStateDirty bumps it so the View watchers always fire
    appSessionState.currentSelectedShapeID = null;
    appSessionState.currentHoveredShapeID = null;
}

export const loadProjectData = (data: unknown): 'ok' | 'invalid' | 'unsupported' => {
    if (!isStoreDataValid(data)) {
        return 'invalid';
    }
    const project = normalizeProject(data);
    if (!project) {
        return 'unsupported';
    }
    replaceStoreData(project.state);
    replaceAppSessionData(project.session);
    markStateDirty();
    // only a successful import gets here, so a failed one keeps the history
    history.reset();
    return 'ok';
}

export const importStoreData = async (file: File | undefined) => {
    if (!file) {
        toast.error("File wasn't picked up. Upload valid JSON file");
        return;
    }
    try {
        const fileContent = await file.text();
        const data: unknown = JSON.parse(fileContent);
        const result = loadProjectData(data);
        if (result === 'invalid') {
            toast.error("The JSON data is not valid. Probably wrong file");
            return;
        }
        if (result === 'unsupported') {
            toast.error("This project file version is not supported");
            return;
        }
        toast.info('Successfully imported');
    } catch (error) {
        toast.error("Failed to parse the file, make sure it is the right one");
    }
}
