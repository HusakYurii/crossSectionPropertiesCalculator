import { downloadText } from "../fileLoader/downloadFiles";
import { MIME_JSON } from "../fileLoader/mimeTypes";
import { PROJECT_FILE_VERSION, PROJECT_SOURCE, type ProjectFile } from "./projectFile";
import { appSessionState, store } from "./store";

export const buildProjectFile = (): ProjectFile => ({
        meta: {
            source: PROJECT_SOURCE,
            version: PROJECT_FILE_VERSION,
        },
        appSessionState: {
            showRotationFor: appSessionState.showRotationFor,
            dimensionLabelOffsets: appSessionState.dimensionLabelOffsets,
        },
        state: {
            geometry: store.geometry,
            geometryExtra: store.geometryExtra,
            crossSectionProperties: store.crossSectionProperties,
            crossSectionPolygon: store.crossSectionPolygon,
            crossSectionMesh: store.crossSectionMesh,
        },
});

export const exportStoreData = () => {
    downloadText('project.json', JSON.stringify(buildProjectFile(), null, 2), MIME_JSON);
}
