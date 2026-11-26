import { beforeEach, describe, expect, it } from 'vitest';
import { commitSectionForm } from '@/features/standard-shapes-modal-editor/commitSectionForm';
import type { SectionFormResult } from '@/features/standard-shapes-modal-editor/sectionForm.types';
import { appSessionState } from '@/store/appSessionState';
import { history } from '@/store/history';
import { store } from '@/store/store';
import { addShape, keys, makeMesh, makePolygon, makeProperties, rectGeometry, resetProject } from '../../store/helpers';

const makeResult = (overrides: Partial<SectionFormResult> = {}): SectionFormResult => ({
	geometry: rectGeometry(),
	crossSectionProperties: makeProperties(5000),
	crossSectionPolygon: makePolygon(),
	...overrides,
});

beforeEach(resetProject);

describe('commitSectionForm', () => {
	it('a new shape gets every group, position 0:0 and one undo step', () => {
		const uid = commitSectionForm({ uid: null, name: 'New', result: makeResult({ crossSectionMesh: makeMesh() }), showRotation: false });
		expect(keys()).toEqual([uid]);
		expect(store.geometryExtra[uid]).toEqual({ name: 'New', position: { x: 0, y: 0 } });
		expect(store.geometry[uid].type).toBe('RECTANGLE');
		expect(store.crossSectionProperties[uid].A).toBe(5000);
		expect(store.crossSectionPolygon[uid]).toHaveLength(4);
		expect(store.crossSectionMesh[uid]).toHaveLength(1);
		history.undo();
		expect(keys()).toEqual([]);
		expect(history.canUndo.value).toBe(false);
	});

	it('an existing shape is renamed and updated, in one step', () => {
		addShape('a', { name: 'Old' });
		const uid = commitSectionForm({
			uid: 'a',
			name: 'Renamed',
			result: makeResult({ geometry: { ...rectGeometry(), w: 70 } as never, crossSectionProperties: makeProperties(7000) }),
			showRotation: false,
		});
		expect(uid).toBe('a');
		expect(store.geometryExtra.a.name).toBe('Renamed');
		expect((store.geometry.a as any).w).toBe(70);
		expect(store.crossSectionProperties.a.A).toBe(7000);
		history.undo();
		expect(store.geometryExtra.a.name).toBe('Old');
		expect((store.geometry.a as any).w).toBe(50);
		history.undo();
		expect(keys()).toEqual([]);
	});

	it('removes an old mesh when the result has none', () => {
		addShape('a', { mesh: makeMesh() });
		expect(store.crossSectionMesh.a).toBeDefined();
		commitSectionForm({ uid: 'a', name: 'x', result: makeResult(), showRotation: false });
		expect(store.crossSectionMesh.a).toBeUndefined();
		commitSectionForm({ uid: 'a', name: 'x', result: makeResult({ crossSectionMesh: [] }), showRotation: false });
		expect(store.crossSectionMesh.a).toBeUndefined();
	});

	it('saves showRotation', () => {
		const uid = commitSectionForm({ uid: null, name: 'R', result: makeResult(), showRotation: true });
		expect(appSessionState.showRotationFor[uid]).toBe(true);
		commitSectionForm({ uid, name: 'R', result: makeResult(), showRotation: false });
		expect(appSessionState.showRotationFor[uid]).toBeUndefined();
	});
});
