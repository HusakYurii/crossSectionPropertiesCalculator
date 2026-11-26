import { markRaw, toRaw } from 'vue';
import { copyPlainData } from '@/shared/utils/plainData';
import { store } from './store';
import type { ShapeRecord } from './shapeRecord.types';
import {
	appSessionState,
	setShowRotation,
} from './appSessionState';

type UID = string;

// raw groups: no dependency tracking and no proxies while diffing
const getStoreDataAsRaw = () => {
	const raw = toRaw(store);
	return {
		geometry: toRaw(raw.geometry),
		geometryExtra: toRaw(raw.geometryExtra),
		crossSectionProperties: toRaw(raw.crossSectionProperties),
		crossSectionPolygon: toRaw(raw.crossSectionPolygon),
		crossSectionMesh: toRaw(raw.crossSectionMesh),
	};
}

const getSessionDataAsRaw = () => {
	const raw = toRaw(appSessionState);
	return {
		showRotationFor: toRaw(raw.showRotationFor),
		dimensionLabelOffsets: toRaw(raw.dimensionLabelOffsets),
	};
}

export const captureShape = (uid: UID): ShapeRecord => {
	const groups = getStoreDataAsRaw();
	const session = getSessionDataAsRaw();
	const record: ShapeRecord = {
		geometry: copyPlainData(groups.geometry[uid]),
		extra: copyPlainData(groups.geometryExtra[uid]),
		properties: copyPlainData(groups.crossSectionProperties[uid]),
		polygon: copyPlainData(groups.crossSectionPolygon[uid]),
	};
	const mesh = groups.crossSectionMesh[uid];
	if (mesh) {
		record.mesh = mesh; // shared, never copied
	}
	if (session.showRotationFor[uid]) {
		record.showRotation = true;
	}
	const offsets = session.dimensionLabelOffsets[uid];
	if (offsets) {
		record.labelOffsets = copyPlainData(offsets);
	}
	return record;
}

/** The store gets copies, because it edits its objects in place. Only the mesh is handed over as it is */
export const writeShape = (uid: UID, record: ShapeRecord) => {
	store.geometry[uid] = copyPlainData(record.geometry);
	store.geometryExtra[uid] = copyPlainData(record.extra);
	store.crossSectionProperties[uid] = copyPlainData(record.properties);
	store.crossSectionPolygon[uid] = copyPlainData(record.polygon);
	if (record.mesh) {
		store.crossSectionMesh[uid] = markRaw(record.mesh);
	} else {
		delete store.crossSectionMesh[uid];
	}
	setShowRotation(uid, record.showRotation === true);
	if (record.labelOffsets) {
		appSessionState.dimensionLabelOffsets[uid] = copyPlainData(record.labelOffsets);
	} else {
		delete appSessionState.dimensionLabelOffsets[uid];
	}
}
