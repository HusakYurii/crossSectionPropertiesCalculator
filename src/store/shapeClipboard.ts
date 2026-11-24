import { ref } from 'vue';
import { PASTE_OFFSET } from '../constants/shapeClipboard';
import { copyPlainData } from '../utils/plainData';
import { appSessionState, markStateDirty, setSelectedShapeID } from './appSessionState';
import { history } from './history';
import { captureShape, writeShape, type ShapeRecord } from './shapeRecord';
import { getUID, store, takeNextHatchAngle } from './store';

/**
 * The clipboard lives in memory only, not in the system one. It is not cleared when another project is
 * loaded, so a shape can be pasted into a different project.
 */
let clipboard: ShapeRecord | null = null;
let pasteCount = 0;

// the menu needs to know whether Paste has something to paste
export const hasClipboard = ref(false);

const getSelectedShapeUID = () => {
	const uid = appSessionState.currentSelectedShapeID;
	return uid && uid in store.geometry ? uid : null;
}

/** Takes a copy of the selected shape as it is now, so a later edit or delete of the original does not change it */
export const copySelectedShape = (): boolean => {
	const uid = getSelectedShapeUID();
	if (!uid) {
		return false;
	}
	clipboard = captureShape(uid);
	pasteCount = 0;
	hasClipboard.value = true;
	return true;
}

/** Adds a copy of `source` moved by `step` paste offsets, selects it and makes it one undo step */
const addShapeCopy = (source: ShapeRecord, step: number) => {
	// getUID is based on the clock, so two pastes in the same millisecond could get the same id
	let uid = getUID();
	while (uid in store.geometry) {
		uid = getUID();
	}

	// the source itself stays untouched; the mesh is shared, because it is never edited in place
	const record: ShapeRecord = { ...source, geometry: copyPlainData(source.geometry), extra: copyPlainData(source.extra) };
	const offset = step * PASTE_OFFSET;
	record.extra.name = `${record.extra.name} copy`;
	record.extra.position = {
		x: record.extra.position.x + offset,
		y: record.extra.position.y + offset,
	};
	// writeShape does not go through addGeometryData, so the alternating hatch is taken here: the copy stands out from the original
	record.geometry.hatchAngle = takeNextHatchAngle(source.geometry.hatchAngle);

	// label offsets and showRotation are written here, before the commit, or the history step would miss them
	writeShape(uid, record);
	// writeShape does not bump redrawId, and the canvas only builds the beam and its labels when it changes
	markStateDirty();
	setSelectedShapeID(uid);
	history.commit();
}

export const pasteShape = (): boolean => {
	if (!clipboard || history.isBlocked()) {
		return false;
	}
	pasteCount++;
	addShapeCopy(clipboard, pasteCount);
	return true;
}

/** Copies the selected shape and pastes it in one go, leaving the clipboard as it was */
export const duplicateSelectedShape = (): boolean => {
	const uid = getSelectedShapeUID();
	if (!uid || history.isBlocked()) {
		return false;
	}
	addShapeCopy(captureShape(uid), 1);
	return true;
}
