import type { Geometry } from '@/shared/shapes/types/common.types';
import type { OSectionGeometry, OSectionHollowGeometry } from '@/shared/shapes/types/OSection.types';
import type { RectangleGeometry } from '@/shared/shapes/types/RectSection.types';
import type { CrossSectionProperties } from '@/shared/types/sectionProperties';
import type { Point } from '@/shared/types/geometry';
import type { Triangle } from '@/shared/types/mesh';
import { EMPTY_CROSS_SECTION_PROPERTIES } from '@/shared/types/sectionProperties';
import { appSessionState, setShowRotation } from '@/store/appSessionState';
import { history } from '@/store/history';
import {
	addCrossSectionPolygon,
	addCrossSectionProperties,
	addGeometryData,
	addGeometryExtraData,
	setCrossSectionMesh,
	store,
} from '@/store/store';
import { EMPTY_PROJECT } from '@/store/persistence/storeDataExporter';
import { loadProjectData } from '@/store/persistence/storeDataImporter';

/** Back to an empty project: resets the store, the session and the history */
export const resetProject = () => {
	const result = loadProjectData(structuredClone(EMPTY_PROJECT));
	if (result !== 'ok') {
		throw new Error('the empty project must load');
	}
	appSessionState.currentSelectedShapeID = null;
	appSessionState.currentHoveredShapeID = null;
};

// the defaults of the forms' getDefault()
export const rectGeometry = (): RectangleGeometry => ({ type: 'RECTANGLE', isNegative: false, rotation: 0, w: 50, h: 100, r: 4 });
export const hollowTubeGeometry = (): OSectionHollowGeometry => ({ type: 'HOLLOW_TUBE', isNegative: false, rotation: 0, d1: 30, d2: 20 });
export const solidTubeGeometry = (): OSectionGeometry => ({ type: 'TUBE', isNegative: false, rotation: 0, d1: 30 });

export const makeProperties = (A: number): CrossSectionProperties => ({ ...EMPTY_CROSS_SECTION_PROPERTIES, A });
export const makePolygon = (w = 50, h = 100): Point[] => [{ x: 0, y: 0 }, { x: 0, y: h }, { x: w, y: h }, { x: w, y: 0 }];
export const makeMesh = (): Triangle[] => [[{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }] as unknown as Triangle];

type AddShapeOptions = {
	name?: string;
	geometry?: Geometry;
	position?: Point;
	showRotation?: boolean;
	mesh?: Triangle[];
	commit?: boolean;
};

/** Adds a shape through the store functions (the way the section editor does) and by default commits one history step */
export const addShape = (uid: string, options: AddShapeOptions = {}) => {
	addGeometryExtraData({ uid, data: { name: options.name ?? `Shape ${uid}`, position: options.position ?? { x: 0, y: 0 } } });
	addGeometryData({ uid, data: options.geometry ?? rectGeometry() });
	addCrossSectionPolygon({ uid, data: makePolygon() });
	addCrossSectionProperties({ uid, data: makeProperties(5000) });
	if (options.mesh) {
		setCrossSectionMesh({ uid, data: options.mesh });
	}
	if (options.showRotation) {
		setShowRotation(uid, true);
	}
	if (options.commit !== false) {
		history.commit();
	}
};

export const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

export const keys = () => Object.keys(store.geometry);
