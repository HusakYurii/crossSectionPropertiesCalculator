import { markRaw, toRaw } from 'vue';
import type { Geometry } from '../interfaces/beams/common.types';
import type { Point } from '../interfaces/common/types';
import type { CrossSectionProperties } from '../interfaces/sectionProperties';
import type { Triangle } from '../solvers/femTriangulator/triangulate';
import { copyPlainData } from '../utils/plainData';
import { store, type GeometryDataExtra } from './store';
import {
	appSessionState,
	setShowRotation,
	type DimensionLabelOffsetKey,
} from './appSessionState';

type UID = string;

/** Everything that makes up one shape: the 5 store groups and the 2 session groups. History and the clipboard both use it */
export type ShapeRecord = {
	geometry: Geometry;
	extra: GeometryDataExtra;
	properties: CrossSectionProperties;
	polygon: Point[];
	mesh?: Triangle[];
	showRotation?: true;
	labelOffsets?: Partial<Record<DimensionLabelOffsetKey, number>>;
};

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
