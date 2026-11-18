import { markRaw, reactive, toRaw } from 'vue';
import type { Geometry, HatchAngle } from '../interfaces/beams/common.types';
import type { Point } from '../interfaces/common/types';
import type { Triangle } from '../solvers/femTriangulator/triangulate';
import type { CrossSectionProperties } from '../interfaces/sectionProperties';
import { markStateDirty } from './appSessionState';

type UID = string;

export type GeometryDataExtra = {
	name: string;
	position: Point; // the centroid of each shape in world coordinates, is used to draw them on canvas and calculate overall props
};

type Payload<T> = {
	uid: UID;
	data: T;
}

export const store = reactive({
	/**
	 * Original geometry data (defined by a user while creating a shape),
	 * like sizes of a web, flanges etc
	 */
	geometry: reactive<Record<UID, Geometry>>({}),
	geometryExtra: reactive<Record<UID, GeometryDataExtra>>({}),
	crossSectionProperties: reactive<Record<UID, CrossSectionProperties>>({}),
	/* This property never changes. It contains original shape points
	* build from left bottom point (the beam's 0:0 ) and goes clockwise
	*/
	crossSectionPolygon: reactive<Record<UID, Point[]>>({}),
	/**
	 * FEM mesh of a shape, as the solver returned it (triangles of the rotated polygon). Only shapes
	 * solved with FEM have one. It can hold thousands of triangles and is never edited in place, so
	 * each mesh is stored as a raw (not deeply reactive) array.
	 */
	crossSectionMesh: reactive<Record<UID, Triangle[]>>({}),
	meta: {
		source: '',
		version: 0,
	}
});

export type Store = typeof store;

export const getUID = (): UID => {
	return String(Math.floor(Date.now() + (Math.random() * Date.now()) / 1000));
}
/** Empties every per-shape group of the store (used before an import replaces the project) */
export const resetStore = () => {
	const groups = [
		store.geometry,
		store.geometryExtra,
		store.crossSectionProperties,
		store.crossSectionPolygon,
		store.crossSectionMesh,
	] as Record<UID, unknown>[];
	for (const group of groups) {
		for (const uid of Object.keys(group)) {
			delete group[uid];
		}
	}
	lastHatchAngle = 135; // the next new shape gets 45
}

// geometry extra data like name and position relative to the other shapes =====
export const addGeometryExtraData = (payload: Payload<GeometryDataExtra>) => {
	store.geometryExtra[payload.uid] = payload.data;
	markStateDirty()
}

export const updateGeometryExtraData = (payload: Payload<Partial<GeometryDataExtra>>) => {
	Object.assign(store.geometryExtra[payload.uid], payload.data);
	markStateDirty()
}

export const removeGeometryExtraData = (uid: UID) => {
	delete store.geometryExtra[uid];
	markStateDirty()
}


// geometry  ====================================
// the hatch alternates 45 -> 135 -> 45 per created shape: a new shape gets the opposite of the one created before it
let lastHatchAngle: HatchAngle = 135;
const oppositeAngle = (angle: HatchAngle): HatchAngle => (angle === 45 ? 135 : 45);

/** Gives the shapes without a hatch angle (old projects) one each, alternating by store order. Stored angles are kept. */
export const ensureHatchAngles = () => {
	Object.keys(store.geometry).forEach((uid, i) => {
		const geometry = store.geometry[uid];
		if (geometry.hatchAngle === undefined) {
			geometry.hatchAngle = i % 2 === 0 ? 45 : 135;
		}
	});
	const angles = Object.values(store.geometry).map(g => g.hatchAngle);
	lastHatchAngle = angles[angles.length - 1] ?? 135;
}

export const addGeometryData = <T extends Geometry>(payload: Payload<T>) => {
	// only new shapes get an angle; one that already has it (a restored or pasted shape) keeps it
	const hatchAngle = payload.data.hatchAngle ?? oppositeAngle(lastHatchAngle);
	lastHatchAngle = hatchAngle;
	store.geometry[payload.uid] = { ...payload.data, hatchAngle };
	markStateDirty()
}

export const updateGeometryData = <T extends Geometry>(payload: Payload<T>) => {
	const stored = store.geometry[payload.uid];

	// A shape can change kind when it is edited (a hollow tube becomes a solid one) and then some of its
	// fields are gone. Object.assign only adds and overwrites, so those fields would stay behind.
	for (const key of Object.keys(stored)) {
		if (!(key in payload.data)) {
			delete (stored as unknown as Record<string, unknown>)[key];
		}
	}
	const { hatchAngle } = stored;
	Object.assign(stored, payload.data);
	// an edit never changes the hatch
	if (hatchAngle !== undefined) {
		stored.hatchAngle = hatchAngle;
	}
	markStateDirty()
}

export const removeGeometryData = (uid: UID) => {
	delete store.geometry[uid];
	markStateDirty()
}

/** A key keeps its place when it is overwritten, so to change the order the keys are put back one by one */
export const setGeometryOrder = (order: UID[]) => {
	for (const uid of order) {
		if (uid in store.geometry) {
			const value = toRaw(store.geometry)[uid];
			delete store.geometry[uid];
			store.geometry[uid] = value;
		}
	}
	markStateDirty(); // View.vue re-sorts the beams on redrawId
}

// CS properties ====================================
export const addCrossSectionProperties = (payload: Payload<CrossSectionProperties>) => {
	store.crossSectionProperties[payload.uid] = payload.data;
	markStateDirty()
}

export const updateCrossSectionProperties = (payload: Payload<CrossSectionProperties>) => {
	Object.assign(store.crossSectionProperties[payload.uid], payload.data)
	markStateDirty()
}

export const removeCrossSectionProperties = (uid: UID) => {
	delete store.crossSectionProperties[uid];
	markStateDirty()
}
// CS polygons ====================================
export const addCrossSectionPolygon = (payload: Payload<Point[]>) => {
	store.crossSectionPolygon[payload.uid] = payload.data;
	markStateDirty()
}

export const updateCrossSectionPolygon = (payload: Payload<Point[]>) => {
	store.crossSectionPolygon[payload.uid].length = 0;
	store.crossSectionPolygon[payload.uid].push(...payload.data)
	markStateDirty()
}

export const removeCrossSectionPolygon = (uid: UID) => {
	delete store.crossSectionPolygon[uid];
	markStateDirty()
}

// CS mesh ====================================
export const setCrossSectionMesh = (payload: Payload<Triangle[]>) => {
	store.crossSectionMesh[payload.uid] = markRaw(payload.data);
	markStateDirty()
}

export const removeCrossSectionMesh = (uid: UID) => {
	delete store.crossSectionMesh[uid];
	markStateDirty()
}
