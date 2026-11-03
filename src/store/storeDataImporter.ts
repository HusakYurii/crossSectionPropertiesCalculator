import { markRaw } from 'vue';
import { toast } from 'vue3-toastify';
import { PROJECT_SOURCE, type ProjectState } from "./projectFile";
import { appSessionState, markStateDirty, resetStore, store, type PersistedSessionState } from "./store";

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

/** Turns a supported file version into the current shape, undefined if the version is unknown */
const normalizeProject = (data: Record<string, any>): NormalizedProject | undefined => {
    if (data.meta.version === 2) {
        return {
            state: data.state ?? {},
            session: {
                showRotationFor: data.appSessionState?.showRotationFor ?? {},
                dimensionLabelOffsets: data.appSessionState?.dimensionLabelOffsets ?? {},
            },
        };
    }
    if (data.meta.version === 1) {
        // legacy file: the flat store itself, there is no session state in it
        const { meta: _meta, ...state } = data;
        return { state: state as ProjectState, session: { showRotationFor: {}, dimensionLabelOffsets: {} } };
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
    Object.assign(appSessionState.showRotationFor, session.showRotationFor);
    Object.assign(appSessionState.dimensionLabelOffsets, session.dimensionLabelOffsets);
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
