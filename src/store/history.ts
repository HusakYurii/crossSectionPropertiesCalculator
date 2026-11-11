import { markRaw, ref, toRaw } from 'vue';
import type { Geometry } from '../interfaces/beams/common.types';
import type { Point } from '../interfaces/common/types';
import type { CrossSectionProperties } from '../interfaces/sectionProperties';
import type { Triangle } from '../solvers/femTriangulator/triangulate';
import { sectionModalState } from './sectionModal';
import {
	appSessionState,
	markStateDirty,
	removeShapeSessionState,
	setGeometryOrder,
	setShowRotation,
	store,
	type DimensionLabelOffsetKey,
	type GeometryDataExtra,
} from './store';

type UID = string;

type ShapeRecord = {
	geometry: Geometry;
	extra: GeometryDataExtra;
	properties: CrossSectionProperties;
	polygon: Point[];
	mesh?: Triangle[];
	showRotation?: true;
	labelOffsets?: Partial<Record<DimensionLabelOffsetKey, number>>;
};

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
	private _isDragging: () => boolean = () => false;
	private _beforeCommit = new Set<() => void>();

	private _updateFlags() {
		this.canUndo.value = this._undoStack.length > 0;
		this.canRedo.value = this._redoStack.length > 0;
	}

	// plain data helpers ====================================

	private _isObject(value: unknown): value is Record<string, unknown> {
		return typeof value === 'object' && value !== null;
	}

	/** Deep copy of plain data; reads through proxies. Unlike JSON it keeps NaN and undefined */
	private _copyData<T>(value: T): T {
		if (!this._isObject(value)) {
			return value;
		}
		const source = toRaw(value) as unknown;
		if (Array.isArray(source)) {
			return source.map(item => this._copyData(item)) as T;
		}
		const result: Record<string, unknown> = {};
		for (const key of Object.keys(source as object)) {
			result[key] = this._copyData((source as Record<string, unknown>)[key]);
		}
		return result as T;
	}

	/** Deep equality with Object.is for numbers, so NaN equals NaN */
	private _isSameData(a: unknown, b: unknown): boolean {
		if (Object.is(a, b)) {
			return true;
		}
		if (!this._isObject(a) || !this._isObject(b)) {
			return false;
		}
		const rawA = toRaw(a);
		const rawB = toRaw(b);
		if (rawA === rawB) {
			return true;
		}
		if (Array.isArray(rawA) || Array.isArray(rawB)) {
			if (!Array.isArray(rawA) || !Array.isArray(rawB) || rawA.length !== rawB.length) {
				return false;
			}
			for (let i = 0; i < rawA.length; i++) {
				if (!this._isSameData(rawA[i], rawB[i])) {
					return false;
				}
			}
			return true;
		}
		const keysA = Object.keys(rawA);
		if (keysA.length !== Object.keys(rawB).length) {
			return false;
		}
		for (const key of keysA) {
			if (!Object.prototype.hasOwnProperty.call(rawB, key) || !this._isSameData(rawA[key], rawB[key])) {
				return false;
			}
		}
		return true;
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

	private _captureShape(uid: UID): ShapeRecord {
		const groups = this._getStoreDataAsRaw();
		const session = this._getSessionDataAsRaw();
		const record: ShapeRecord = {
			geometry: this._copyData(groups.geometry[uid]),
			extra: this._copyData(groups.geometryExtra[uid]),
			properties: this._copyData(groups.crossSectionProperties[uid]),
			polygon: this._copyData(groups.crossSectionPolygon[uid]),
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
			record.labelOffsets = this._copyData(offsets);
		}
		return record;
	}

	private _isShapeUnchanged(uid: UID, record: ShapeRecord): boolean {
		const groups = this._getStoreDataAsRaw();
		const session = this._getSessionDataAsRaw();
		// properties and the polygon are only written with the geometry, and a recalculated FEM shape also gets a new mesh
		return Object.is(groups.crossSectionMesh[uid], record.mesh)
			&& Boolean(session.showRotationFor[uid]) === Boolean(record.showRotation)
			&& this._isSameData(groups.geometry[uid], record.geometry)
			&& this._isSameData(groups.geometryExtra[uid], record.extra)
			&& this._isSameData(session.dimensionLabelOffsets[uid], record.labelOffsets);
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

	/** The store gets copies, because it edits its objects in place. Only the mesh is handed over as it is */
	private _writeShape(uid: UID, record: ShapeRecord) {
		store.geometry[uid] = this._copyData(record.geometry);
		store.geometryExtra[uid] = this._copyData(record.extra);
		store.crossSectionProperties[uid] = this._copyData(record.properties);
		store.crossSectionPolygon[uid] = this._copyData(record.polygon);
		if (record.mesh) {
			store.crossSectionMesh[uid] = markRaw(record.mesh);
		} else {
			delete store.crossSectionMesh[uid];
		}
		setShowRotation(uid, record.showRotation === true);
		if (record.labelOffsets) {
			appSessionState.dimensionLabelOffsets[uid] = this._copyData(record.labelOffsets);
		} else {
			delete appSessionState.dimensionLabelOffsets[uid];
		}
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
			this._base.set(uid, this._captureShape(uid));
		}
		this._baseOrder = Object.keys(geometry);
	}

	private _restore(entry: Entry, direction: 'before' | 'after') {
		for (const change of entry.changes) {
			const record = change[direction];
			if (record) {
				this._writeShape(change.uid, record);
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
		// setPosition and the label offsets do not bump redrawId, so a restore always does
		markStateDirty();
	}

	private _isBlocked(): boolean {
		return sectionModalState.isOpen || this._isDragging();
	}

	/** Edits that are still waiting get saved first, so they are part of what undo takes back */
	private _settlePendingEdits() {
		this._beforeCommit.forEach(callback => callback());
		this.commit();
	}

	// public API ====================================

	readonly canUndo = ref(false);
	readonly canRedo = ref(false);

	/** The canvas tells history whether a drag is going on, undo and redo are blocked meanwhile */
	setDragProbe(probe: (() => boolean) | null) {
		this._isDragging = probe ?? (() => false);
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
				changes.push({ uid, before, after: this._captureShape(uid) });
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
		if (this._isBlocked()) {
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
		if (this._isBlocked()) {
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
