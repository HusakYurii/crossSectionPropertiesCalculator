import { filesDownloader } from "../services/singletons/FilesDownloader";
import { MIME_JSON } from "../constants/mimeTypes";
import { PROJECT_FILE_VERSION, PROJECT_SOURCE, type ProjectFile } from "./projectFile";
import { normalizeFileName } from "../utils/fileNameUtils";
import { store } from "./store";
import { appSessionState } from "./appSessionState";

export const EMPTY_PROJECT: ProjectFile = {
    meta: {
        source: PROJECT_SOURCE,
        version: PROJECT_FILE_VERSION,
    },
    appSessionState: {
        showRotationFor: {},
        dimensionLabelOffsets: {},
        compositeLabelOffsets: {},
    },
    state: {
        geometry: {},
        geometryExtra: {},
        crossSectionProperties: {},
        crossSectionPolygon: {},
        crossSectionMesh: {},
    },
}

export const buildProjectFile = (): ProjectFile => ({
    meta: { source: PROJECT_SOURCE, version: PROJECT_FILE_VERSION },
    appSessionState: {
        showRotationFor: appSessionState.showRotationFor,
        dimensionLabelOffsets: appSessionState.dimensionLabelOffsets,
        compositeLabelOffsets: appSessionState.compositeLabelOffsets,
    },
    state: {
        geometry: store.geometry,
        geometryExtra: store.geometryExtra,
        crossSectionProperties: store.crossSectionProperties,
        crossSectionPolygon: store.crossSectionPolygon,
        crossSectionMesh: store.crossSectionMesh,
    },
});

export const DEFAULT_PROJECT_FILE_NAME = 'project';

export const exportStoreData = (fileName = DEFAULT_PROJECT_FILE_NAME) => {
    filesDownloader.downloadText(normalizeFileName(fileName, 'json', DEFAULT_PROJECT_FILE_NAME), JSON.stringify(buildProjectFile(), null, 2), MIME_JSON);
}
