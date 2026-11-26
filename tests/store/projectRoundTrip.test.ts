import { beforeEach, describe, expect, it } from 'vitest';
import { appSessionState, setCompositeLabelOffset, setDimensionLabelOffset } from '@/store/appSessionState';
import { history } from '@/store/history';
import { store } from '@/store/store';
import { EMPTY_PROJECT, buildProjectFile } from '@/store/persistence/storeDataExporter';
import { importExampleProject, importStoreData, loadProjectData } from '@/store/persistence/storeDataImporter';
import { addShape, hollowTubeGeometry, makeMesh, plain, resetProject } from './helpers';

beforeEach(resetProject);

describe('project round-trip', () => {
	it('build, serialise and load gives the same store and session, and no history', () => {
		addShape('a', { name: 'One', position: { x: 3, y: 4 }, showRotation: true, mesh: makeMesh() });
		addShape('b', { name: 'Two', geometry: hollowTubeGeometry() });
		setDimensionLabelOffset('a', 'x', 11);
		setDimensionLabelOffset('b', 'xAlong', 0);
		setCompositeLabelOffset('y', -4);
		history.commit();
		expect(history.canUndo.value).toBe(true);

		const file = JSON.parse(JSON.stringify(buildProjectFile()));
		const storeBefore = plain(store);
		const sessionBefore = plain(buildProjectFile().appSessionState);

		resetProject();
		expect(Object.keys(store.geometry)).toEqual([]);
		expect(loadProjectData(file)).toBe('ok');

		expect(plain(store)).toEqual(storeBefore);
		expect(plain(buildProjectFile().appSessionState)).toEqual(sessionBefore);
		expect(Object.keys(store.geometry)).toEqual(['a', 'b']);
		expect(history.canUndo.value).toBe(false);
		expect(history.canRedo.value).toBe(false);
		expect(history.undo()).toBe(false);
	});

	it('a wrong meta.source is invalid, keeps the store and the history', () => {
		addShape('a');
		const before = plain(store);
		const bad = { ...JSON.parse(JSON.stringify(buildProjectFile())), meta: { source: 'other', version: 1 } };
		expect(loadProjectData(bad)).toBe('invalid');
		expect(loadProjectData(null)).toBe('invalid');
		expect(plain(store)).toEqual(before);
		expect(history.canUndo.value).toBe(true);
	});

	it('drops a zero x/y and a non-finite label offset on load', () => {
		const file = JSON.parse(JSON.stringify(buildProjectFile()));
		file.appSessionState.dimensionLabelOffsets = {
			a: { x: 0, y: 5, xAlong: 0, yAlong: 'nope' },
			b: { x: 0, y: Infinity },
			c: { x: 1 },
		};
		file.appSessionState.compositeLabelOffsets = { x: 0, y: 2, xAlong: null };
		expect(loadProjectData(file)).toBe('ok');
		expect(appSessionState.dimensionLabelOffsets).toEqual({ a: { y: 5, xAlong: 0 }, c: { x: 1 } });
		expect(plain(appSessionState.compositeLabelOffsets)).toEqual({ y: 2 });
	});

	it('reports import results', async () => {
		expect(await importStoreData(undefined)).toBe('no-file');
		expect(await importStoreData(new File(['{'], 'a.json'))).toBe('parse-error');
		expect(await importExampleProject(() => Promise.reject(new Error('x')))).toBe('load-failed');
		expect(await importStoreData(new File(['{"meta":{"source":"x"}}'], 'a.json'))).toBe('invalid');
		expect(await importStoreData(new File([JSON.stringify(buildProjectFile())], 'a.json'))).toBe('ok');
		expect(await importExampleProject(async () => structuredClone(EMPTY_PROJECT))).toBe('ok');
	});
});
