import { beforeEach, describe, expect, it } from 'vitest';
import { appSessionState, setDimensionLabelOffset, setSelectedShapeID, setHoveredShapeID } from '@/store/appSessionState';
import { history } from '@/store/history';
import { captureShape } from '@/store/shapeRecord';
import {
	removeCrossSectionPolygon,
	removeCrossSectionProperties,
	removeGeometryData,
	removeGeometryExtraData,
	setGeometryOrder,
	store,
	updateGeometryData,
	updateGeometryExtraData,
} from '@/store/store';
import { addShape, hollowTubeGeometry, keys, makeMesh, plain, resetProject, solidTubeGeometry } from './helpers';

const removeShape = (uid: string) => {
	removeGeometryData(uid);
	removeGeometryExtraData(uid);
	removeCrossSectionProperties(uid);
	removeCrossSectionPolygon(uid);
};

beforeEach(resetProject);

describe('history: add', () => {
	it('undo removes every group of the shape, redo restores an identical record', () => {
		addShape('a', { showRotation: true, mesh: makeMesh() });
		setDimensionLabelOffset('a', 'x', 12);
		expect(history.commit()).toBe(true);
		const before = plain(captureShape('a'));
		expect(before.showRotation).toBe(true);
		expect(before.labelOffsets).toEqual({ x: 12 });

		expect(history.undo()).toBe(true); // label offset only
		expect(appSessionState.dimensionLabelOffsets.a).toBeUndefined();
		expect(history.undo()).toBe(true); // the shape itself
		expect(store.geometry.a).toBeUndefined();
		expect(store.geometryExtra.a).toBeUndefined();
		expect(store.crossSectionProperties.a).toBeUndefined();
		expect(store.crossSectionPolygon.a).toBeUndefined();
		expect(store.crossSectionMesh.a).toBeUndefined();
		expect(appSessionState.showRotationFor.a).toBeUndefined();
		expect(appSessionState.dimensionLabelOffsets.a).toBeUndefined();
		expect(history.canUndo.value).toBe(false);
		expect(history.canRedo.value).toBe(true);

		history.redo();
		history.redo();
		expect(plain(captureShape('a'))).toEqual(before);
		expect(history.canRedo.value).toBe(false);
	});
});

describe('history: edit', () => {
	it('undoes and redoes a data edit', () => {
		addShape('a');
		updateGeometryData({ uid: 'a', data: { ...store.geometry.a, w: 80 } as never });
		history.commit();
		expect((store.geometry.a as any).w).toBe(80);
		history.undo();
		expect((store.geometry.a as any).w).toBe(50);
		history.redo();
		expect((store.geometry.a as any).w).toBe(80);
	});

	it('undoes a kind change (hollow to solid tube)', () => {
		addShape('a', { geometry: hollowTubeGeometry() });
		const hatch = store.geometry.a.hatchAngle;
		updateGeometryData({ uid: 'a', data: { ...solidTubeGeometry() } });
		history.commit();
		expect(store.geometry.a.type).toBe('TUBE');
		expect('d2' in store.geometry.a).toBe(false);
		history.undo();
		expect(store.geometry.a.type).toBe('HOLLOW_TUBE');
		expect((store.geometry.a as any).d2).toBe(20);
		expect(store.geometry.a.hatchAngle).toBe(hatch);
		history.redo();
		expect(store.geometry.a.type).toBe('TUBE');
		expect('d2' in store.geometry.a).toBe(false);
	});
});

describe('history: delete, reorder, move', () => {
	it('undoes a delete', () => {
		addShape('a');
		const before = plain(captureShape('a'));
		removeShape('a');
		history.commit();
		expect(keys()).toEqual([]);
		history.undo();
		expect(plain(captureShape('a'))).toEqual(before);
	});

	it('restores the key order on undo and redo of a reorder', () => {
		addShape('a');
		addShape('b');
		addShape('c');
		setGeometryOrder(['c', 'a', 'b']);
		expect(history.commit()).toBe(true);
		expect(keys()).toEqual(['c', 'a', 'b']);
		history.undo();
		expect(keys()).toEqual(['a', 'b', 'c']);
		history.redo();
		expect(keys()).toEqual(['c', 'a', 'b']);
	});

	it('undoes a move and a label offset', () => {
		addShape('a');
		updateGeometryExtraData({ uid: 'a', data: { position: { x: 30, y: 40 } } });
		history.commit();
		setDimensionLabelOffset('a', 'y', 7);
		history.commit();
		history.undo();
		expect(appSessionState.dimensionLabelOffsets.a).toBeUndefined();
		history.undo();
		expect(store.geometryExtra.a.position).toEqual({ x: 0, y: 0 });
		history.redo();
		expect(store.geometryExtra.a.position).toEqual({ x: 30, y: 40 });
	});
});

describe('history: stacks', () => {
	it('a commit with no difference returns false and adds no step', () => {
		addShape('a');
		expect(history.commit()).toBe(false);
		history.undo();
		expect(history.canUndo.value).toBe(false);
	});

	it('a new commit clears redo', () => {
		addShape('a');
		addShape('b');
		history.undo();
		expect(history.canRedo.value).toBe(true);
		addShape('c');
		expect(history.canRedo.value).toBe(false);
		expect(history.redo()).toBe(false);
	});

	it('keeps only 100 steps', () => {
		for (let i = 0; i < 101; i++) {
			addShape(`s${i}`);
		}
		let undone = 0;
		while (history.undo()) {
			undone++;
		}
		expect(undone).toBe(100);
		expect(keys()).toEqual(['s0']);
	});

	it('an undo that removes the selected or hovered shape clears them', () => {
		addShape('a');
		addShape('b');
		setSelectedShapeID('b');
		setHoveredShapeID('b');
		history.undo();
		expect(appSessionState.currentSelectedShapeID).toBeNull();
		expect(appSessionState.currentHoveredShapeID).toBeNull();
	});

	it('keeps the selection when the selected shape survives', () => {
		addShape('a');
		addShape('b');
		setSelectedShapeID('a');
		history.undo();
		expect(appSessionState.currentSelectedShapeID).toBe('a');
	});

	it('onBeforeCommit runs before undo, and its edit becomes part of the undone step', () => {
		addShape('a');
		let calls = 0;
		const off = history.onBeforeCommit(() => {
			calls++;
			updateGeometryExtraData({ uid: 'a', data: { name: 'pending' } });
		});
		history.undo(); // settles the pending name as a step, then undoes that step
		off();
		expect(calls).toBe(1);
		expect(store.geometryExtra.a.name).toBe('Shape a');
		expect(history.canRedo.value).toBe(true);
		history.redo();
		expect(store.geometryExtra.a.name).toBe('pending');
	});
});

describe('history: blocked', () => {
	it('a registered blocker blocks undo and redo and keeps the stacks', () => {
		addShape('a');
		addShape('b');
		history.undo();
		const remove = history.addBlocker(() => true);
		expect(history.isBlocked()).toBe(true);
		expect(history.undo()).toBe(false);
		expect(history.redo()).toBe(false);
		expect(keys()).toEqual(['a']);
		expect(history.canUndo.value).toBe(true);
		expect(history.canRedo.value).toBe(true);
		remove();
		expect(history.isBlocked()).toBe(false);
		expect(history.redo()).toBe(true);
		expect(keys()).toEqual(['a', 'b']);
	});

	it('every blocker counts, and removing one leaves the others', () => {
		let a = true;
		let b = false;
		const removeA = history.addBlocker(() => a);
		const removeB = history.addBlocker(() => b);
		expect(history.isBlocked()).toBe(true);
		a = false;
		expect(history.isBlocked()).toBe(false);
		b = true;
		expect(history.isBlocked()).toBe(true);
		removeB();
		expect(history.isBlocked()).toBe(false);
		removeA();
	});
});
