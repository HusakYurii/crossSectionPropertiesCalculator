import { ref, toRaw } from 'vue';
import type { Triangle } from '@/shared/types/mesh';
import { isSamePlainData } from '@/shared/utils/plainData';
import { setGeometryOrder, store } from './store';
import {
	appSessionState,
	markStateDirty,
	removeShapeSessionState,
} from './appSessionState';
import { captureShape, writeShape } from './shapeRecord';
import type { ShapeRecord } from './shapeRecord.types';

type UID = string;

type Change = { uid: UID; before: ShapeRecord | null; after: ShapeRecord | null };

type Entry = {
	changes: Change[];
	// only when the order of store.geometry changed, it decides the list and the z-order of the shapes
	orderBefore?: UID[];
	orderAfter?: UID[];
};

const MAX_STEPS = 100;
// triangles of the meshes that only history keeps alive
const MAX_OLD_MESH_TRIANGLES = 500000;

/**
 * Undo / redo. The store is edited directly, so instead of an inverse for every action we keep the last
 * saved copy of every shape (`_base`). commit() compares the store with it and records only the shapes
 * that differ, as a before/after pair. A call site that forgets commit() is harmless: its change just
 * joins the next step.
 *
 * Records are never edited after they are made, so a step's `after` is shared as the next step's `before`.
 * Meshes are never edited in place either, so records point to them instead of copying them.
 */
class History {
	// plain arrays on purpose, so Vue does not wrap them. Only canUndo and canRedo are reactive
	private _undoStack: Entry[] = [];
	private _redoStack: Entry[] = [];

	private _base = new Map<UID, ShapeRecord>();
	private _baseOrder: UID[] = [];
	private _blockers = new Set<() => boolean>();
	private _beforeCommit = new Set<() => void>();

	private _updateFlags() {
		this.canUndo.value = this._undoStack.length > 0;
		this.canRedo.value = this._redoStack.length > 0;
	}

	// reading the store ====================================

	// raw groups: no dependency tracking and no proxies while diffing
	private _getStoreDataAsRaw() {
		const raw = toRaw(store);
		return {
			geometry: toRaw(raw.geometry),
			geometryExtra: toRaw(raw.geometryExtra),
			crossSectionProperties: toRaw(raw.crossSectionProperties),
			crossSectionPolygon: toRaw(raw.crossSectionPolygon),
			crossSectionMesh: toRaw(raw.crossSectionMesh),
		};
	}

	private _getSessionDataAsRaw() {
		const raw = toRaw(appSessionState);
		return {
			showRotationFor: toRaw(raw.showRotationFor),
			dimensionLabelOffsets: toRaw(raw.dimensionLabelOffsets),
		};
	}

	private _isShapeUnchanged(uid: UID, record: ShapeRecord): boolean {
		const groups = this._getStoreDataAsRaw();
		const session = this._getSessionDataAsRaw();
		// properties and the polygon are only written with the geometry, and a recalculated FEM shape also gets a new mesh
		return Object.is(groups.crossSectionMesh[uid], record.mesh)
			&& Boolean(session.showRotationFor[uid]) === Boolean(record.showRotation)
			&& isSamePlainData(groups.geometry[uid], record.geometry)
			&& isSamePlainData(groups.geometryExtra[uid], record.extra)
			&& isSamePlainData(session.dimensionLabelOffsets[uid], record.labelOffsets);
	}

	private _isSameOrder(a: UID[], b: UID[]): boolean {
		return a.length === b.length && a.every((uid, i) => uid === b[i]);
	}

	// writing the store ====================================

	private _removeShape(uid: UID) {
		delete store.geometry[uid];
		delete store.geometryExtra[uid];
		delete store.crossSectionProperties[uid];
		delete store.crossSectionPolygon[uid];
		delete store.crossSectionMesh[uid];
		removeShapeSessionState(uid);
	}

	// limits ====================================

	private _entryRecords(entry: Entry): ShapeRecord[] {
		const records: ShapeRecord[] = [];
		for (const { before, after } of entry.changes) {
			before && records.push(before);
			after && records.push(after);
		}
		return records;
	}

	/** Triangles of the distinct meshes that live only in history. The ones the store holds are not extra */
	private _countOldMeshTriangles(): number {
		const live = new Set<Triangle[]>();
		for (const record of this._base.values()) {
			record.mesh && live.add(record.mesh);
		}
		const seen = new Set<Triangle[]>();
		let total = 0;
		for (const entry of [...this._undoStack, ...this._redoStack]) {
			for (const { mesh } of this._entryRecords(entry)) {
				if (mesh && !live.has(mesh) && !seen.has(mesh)) {
					seen.add(mesh);
					total += mesh.length;
				}
			}
		}
		return total;
	}

	private _enforceLimits() {
		while (this._undoStack.length > MAX_STEPS) {
			this._undoStack.shift();
		}
		// the newest entry stays even if one mesh alone is over the budget
		while (this._undoStack.length > 1 && this._countOldMeshTriangles() > MAX_OLD_MESH_TRIANGLES) {
			this._undoStack.shift();
		}
	}

	// steps ====================================

	private _takeSnapshot() {
		this._base = new Map();
		const geometry = this._getStoreDataAsRaw().geometry;
		for (const uid of Object.keys(geometry)) {
			this._base.set(uid, captureShape(uid));
		}
		this._baseOrder = Object.keys(geometry);
	}

	private _restore(entry: Entry, direction: 'before' | 'after') {
		for (const change of entry.changes) {
			const record = change[direction];
			if (record) {
				writeShape(change.uid, record);
				this._base.set(change.uid, record);
			} else {
				this._removeShape(change.uid);
				this._base.delete(change.uid);
			}
		}
		const order = direction === 'before' ? entry.orderBefore : entry.orderAfter;
		if (order) {
			setGeometryOrder(order);
		}
		this._baseOrder = Object.keys(this._getStoreDataAsRaw().geometry);

		// selection and hover are not recorded, but they must not point to a shape that is gone
		if (appSessionState.currentSelectedShapeID && !(appSessionState.currentSelectedShapeID in store.geometry)) {
			appSessionState.currentSelectedShapeID = null;
		}
		if (appSessionState.currentHoveredShapeID && !(appSessionState.currentHoveredShapeID in store.geometry)) {
			appSessionState.currentHoveredShapeID = null;
		}
		// setShapePosition and the label offsets do not bump redrawId, so a restore always does
		markStateDirty();
	}

	/** Edits that are still waiting get saved first, so they are part of what undo takes back */
	private _settlePendingEdits() {
		this._beforeCommit.forEach(callback => callback());
		this.commit();
	}

	// public API ====================================

	readonly canUndo = ref(false);
	readonly canRedo = ref(false);

	/** True while any registered blocker says so (the shape dialog is open, a drag is going on): undo, redo and paste wait */
	isBlocked(): boolean {
		for (const probe of this._blockers) {
			if (probe()) {
				return true;
			}
		}
		return false;
	}

	/** Registers a probe; returns the function that removes it */
	addBlocker(probe: () => boolean): () => void {
		this._blockers.add(probe);
		return () => { this._blockers.delete(probe); };
	}

	/** Runs before undo / redo commit, so edits that are still waiting (a debounced write) land first */
	onBeforeCommit(callback: () => void): () => void {
		this._beforeCommit.add(callback);
		return () => { this._beforeCommit.delete(callback); };
	}

	/** Takes the current store as the new starting point and forgets every step (used after an import) */
	reset() {
		this._takeSnapshot();
		this._undoStack.length = 0;
		this._redoStack.length = 0;
		this._updateFlags();
	}

	/** Saves what changed since the last commit as one step. Does nothing when there is no difference */
	commit(): boolean {
		const geometry = this._getStoreDataAsRaw().geometry;
		const uids = Object.keys(geometry);
		const changes: Change[] = [];

		for (const uid of uids) {
			const before = this._base.get(uid) ?? null;
			if (!before || !this._isShapeUnchanged(uid, before)) {
				changes.push({ uid, before, after: captureShape(uid) });
			}
		}
		for (const [uid, before] of this._base) {
			if (!(uid in geometry)) {
				changes.push({ uid, before, after: null });
			}
		}
		const orderChanged = !this._isSameOrder(uids, this._baseOrder);
		if (changes.length === 0 && !orderChanged) {
			return false;
		}

		const entry: Entry = { changes };
		if (orderChanged) {
			entry.orderBefore = this._baseOrder;
			entry.orderAfter = uids;
		}
		for (const { uid, after } of changes) {
			after ? this._base.set(uid, after) : this._base.delete(uid);
		}
		this._baseOrder = uids;

		this._undoStack.push(entry);
		this._redoStack.length = 0;
		this._enforceLimits();
		this._updateFlags();
		return true;
	}

	undo(): boolean {
		if (this.isBlocked()) {
			return false;
		}
		this._settlePendingEdits();
		const entry = this._undoStack.pop();
		if (!entry) {
			this._updateFlags();
			return false;
		}
		this._restore(entry, 'before');
		this._redoStack.push(entry);
		this._updateFlags();
		return true;
	}

	redo(): boolean {
		if (this.isBlocked()) {
			return false;
		}
		this._settlePendingEdits();
		const entry = this._redoStack.pop();
		if (!entry) {
			this._updateFlags();
			return false;
		}
		this._restore(entry, 'after');
		this._undoStack.push(entry);
		this._updateFlags();
		return true;
	}
}

export const history = new History();
