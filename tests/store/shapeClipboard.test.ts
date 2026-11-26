import { beforeEach, describe, expect, it } from 'vitest';
import { appSessionState, setDimensionLabelOffset, setSelectedShapeID } from '@/store/appSessionState';
import { history } from '@/store/history';
import { copySelectedShape, duplicateSelectedShape, hasClipboard, pasteShape } from '@/store/shapeClipboard';
import { store, updateGeometryExtraData } from '@/store/store';
import { addShape, keys, resetProject } from './helpers';

beforeEach(() => {
	resetProject();
	addShape('a', { name: 'Beam', position: { x: 5, y: 6 }, showRotation: true });
	setDimensionLabelOffset('a', 'x', 9);
	history.commit();
	setSelectedShapeID('a');
});

describe('shapeClipboard', () => {
	it('copy then paste gives a new shape, offset +10 then +20, with an opposite hatch and one undo step', () => {
		expect(copySelectedShape()).toBe(true);
		expect(hasClipboard.value).toBe(true);

		expect(pasteShape()).toBe(true);
		expect(keys()).toHaveLength(2);
		const uid1 = keys()[1];
		expect(uid1).not.toBe('a');
		expect(store.geometryExtra[uid1].name).toBe('Beam copy');
		expect(store.geometryExtra[uid1].position).toEqual({ x: 15, y: 16 });
		expect(store.geometry[uid1].hatchAngle).not.toBe(store.geometry.a.hatchAngle);
		expect(appSessionState.showRotationFor[uid1]).toBe(true);
		expect(appSessionState.dimensionLabelOffsets[uid1]).toEqual({ x: 9 });
		expect(appSessionState.currentSelectedShapeID).toBe(uid1);

		expect(pasteShape()).toBe(true);
		const uid2 = keys()[2];
		expect(store.geometryExtra[uid2].position).toEqual({ x: 25, y: 26 });

		history.undo();
		expect(keys()).toEqual(['a', uid1]);
		history.undo();
		expect(keys()).toEqual(['a']);
	});

	it('editing the original after copy does not change the paste', () => {
		copySelectedShape();
		updateGeometryExtraData({ uid: 'a', data: { name: 'Changed', position: { x: 100, y: 100 } } });
		(store.geometry.a as any).w = 999;
		history.commit();
		pasteShape();
		const uid = keys()[1];
		expect(store.geometryExtra[uid].name).toBe('Beam copy');
		expect(store.geometryExtra[uid].position).toEqual({ x: 15, y: 16 });
		expect((store.geometry[uid] as any).w).toBe(50);
	});

	it('duplicate adds a copy and leaves the clipboard alone', () => {
		copySelectedShape();
		setSelectedShapeID('a');
		expect(duplicateSelectedShape()).toBe(true);
		const dup = keys()[1];
		expect(store.geometryExtra[dup].position).toEqual({ x: 15, y: 16 });
		// the clipboard still holds the first copy, its paste counter was not advanced
		updateGeometryExtraData({ uid: 'a', data: { name: 'Other' } });
		history.commit();
		expect(pasteShape()).toBe(true);
		expect(store.geometryExtra[keys()[2]].name).toBe('Beam copy');
		expect(store.geometryExtra[keys()[2]].position).toEqual({ x: 15, y: 16 });
		history.undo(); // paste
		history.undo(); // rename
		history.undo(); // duplicate
		expect(keys()).toEqual(['a']);
	});

	it('paste and duplicate return false while blocked', () => {
		copySelectedShape();
		const remove = history.addBlocker(() => true);
		expect(pasteShape()).toBe(false);
		expect(duplicateSelectedShape()).toBe(false);
		expect(keys()).toEqual(['a']);
		remove();
		expect(pasteShape()).toBe(true);
	});

	it('copy and duplicate need a selected shape', () => {
		setSelectedShapeID(null);
		expect(copySelectedShape()).toBe(false);
		expect(duplicateSelectedShape()).toBe(false);
	});
});
