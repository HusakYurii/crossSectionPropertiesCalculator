import { markRaw } from 'vue';
import { PROJECT_SOURCE, type ProjectState } from "./projectFile";
import { history } from "../history";
import { ensureHatchAngles, resetStore, store } from "../store";
import { appSessionState, markStateDirty, resetViewToggles } from "../appSessionState";
import type { PersistedSessionState } from "../appSessionState.types";
import type { DimensionLabelOffsetKey } from "@/shared/types/dimensionLabels";
import type { ImportResult } from "./storeDataImporter.types";

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

/** Reads the project file into the store / session shapes */
const readProject = (data: Record<string, any>): NormalizedProject => ({
    state: data.state ?? {},
    session: {
        showRotationFor: data.appSessionState?.showRotationFor ?? {},
        dimensionLabelOffsets: sanitizeShapeLabelOffsets(data.appSessionState?.dimensionLabelOffsets),
        compositeLabelOffsets: sanitizeLabelOffsets(data.appSessionState?.compositeLabelOffsets),
    },
})

const replaceStoreData = (state: Partial<ProjectState>) => {
    resetStore();
    Object.assign(store.geometry, state.geometry);
    ensureHatchAngles();
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
    resetViewToggles();
    Object.assign(appSessionState.compositeLabelOffsets, session.compositeLabelOffsets);
    // redrawId is left alone, markStateDirty bumps it so the View watchers always fire
    appSessionState.currentSelectedShapeID = null;
    appSessionState.currentHoveredShapeID = null;
}

export const loadProjectData = (data: unknown): 'ok' | 'invalid' => {
    if (!isStoreDataValid(data)) {
        return 'invalid';
    }
    const project = readProject(data);
    replaceStoreData(project.state);
    replaceAppSessionData(project.session);
    markStateDirty();
    // only a successful import gets here, so a failed one keeps the history
    history.reset();
    return 'ok';
}

export const importExampleProject = async (load: () => Promise<unknown>): Promise<ImportResult> => {
    try {
        // the module's JSON object is cached and the store mutates what it is given, so load a copy
        return loadProjectData(structuredClone(await load()));
    } catch (error) {
        return 'load-failed';
    }
}

export const importStoreData = async (file: File | undefined): Promise<ImportResult> => {
    if (!file) {
        return 'no-file';
    }
    try {
        const fileContent = await file.text();
        const data: unknown = JSON.parse(fileContent);
        return loadProjectData(data);
    } catch (error) {
        return 'parse-error';
    }
}
