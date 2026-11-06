import { buildProjectFile } from '../../store/storeDataExporter';
import type { ProjectFile } from '../../store/projectFile';
import { store } from '../../store/store';

const KEY_PREFIX = 'cspc-report:';
const KEEP_LAST = 3;

export type ReportSnapshot = {
	createdAt: string; // ISO
	project: ProjectFile;
};

// a thousandth of a mm can't be seen on paper, and fewer digits let far bigger meshes fit in localStorage
const roundCoordinate = (value: number) => Math.round(value * 1000) / 1000;

/** The project as the Export builds it, with the mesh coordinates rounded: the report only draws the meshes */
export function createReportSnapshot(): ReportSnapshot {
	const project = buildProjectFile();

	const crossSectionMesh: ProjectFile['state']['crossSectionMesh'] = {};
	for (const uid of Object.keys(store.crossSectionMesh)) {
		crossSectionMesh[uid] = store.crossSectionMesh[uid].map(([a, b, c]) => [
			{ x: roundCoordinate(a.x), y: roundCoordinate(a.y) },
			{ x: roundCoordinate(b.x), y: roundCoordinate(b.y) },
			{ x: roundCoordinate(c.x), y: roundCoordinate(c.y) },
		]);
	}
	project.state = { ...project.state, crossSectionMesh };

	return { createdAt: new Date().toISOString(), project };
}

/** Removes the oldest snapshots so that at most `keep` stay */
function pruneSnapshots(keep: number): void {
	const ids: number[] = [];
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(KEY_PREFIX)) {
			ids.push(Number(key.slice(KEY_PREFIX.length)));
		}
	}
	ids.sort((a, b) => b - a);
	ids.slice(keep).forEach(oldId => localStorage.removeItem(KEY_PREFIX + oldId));
}

/** Returns the id of the saved snapshot, null if the browser refused to store it (quota) */
export function saveReportSnapshot(snapshot: ReportSnapshot): string | null {
	const id = String(Date.now());
	const key = KEY_PREFIX + id;
	const data = JSON.stringify(snapshot);
	// before the write, so old snapshots can never fill the quota and block every new one
	pruneSnapshots(KEEP_LAST - 1);
	try {
		localStorage.setItem(key, data);
	} catch {
		// meshes can make a snapshot big: the new report matters more than reloading the old ones
		pruneSnapshots(0);
		try {
			localStorage.setItem(key, data);
		} catch {
			return null;
		}
	}
	return id;
}

export function loadReportSnapshot(id: string): ReportSnapshot | null {
	try {
		const raw = localStorage.getItem(KEY_PREFIX + id);
		return raw ? JSON.parse(raw) as ReportSnapshot : null;
	} catch {
		return null;
	}
}
