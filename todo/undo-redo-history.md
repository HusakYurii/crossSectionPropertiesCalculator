# Undo / redo history

The app has no history, so every change is permanent. This is the design for adding undo and redo. Nothing is implemented yet.

**Decision so far:** no external library, save only what changed in each shape, save when an action ends instead of on a timer, and flatten only the mesh (as a separate, later change).

## Requirements
- Cover all project data changes.
- Importing a project resets the history.
- Stay memory efficient and don't save a step for every tiny change.

## Data structures: flatten only the mesh
Measured in Node on the real solver output for `h secion.csv`. Chrome's object forms should be somewhat smaller, so the object-vs-flat gaps there will be narrower.

| Data | Size | `{x,y}` objects | `Float64Array` |
|---|---|---|---|
| Mesh, subdivide level 2 | 14,912 triangles | 4,311 KB | 700 KB |
| Polygon | 28 points | 2.3 KB | 0.66 KB |

- **Polygons:** leave them as they are. Flattening saves about 1.6 KB per shape, but about 60 files mention `Point[]`, `Triangle[]` or `Polygon`.
- **Meshes:** flattening is worth doing, but history doesn't depend on it. It shrinks live memory too, and could help export size and the report's localStorage limit.
- **Shared references:** the bigger saving is that meshes are never edited in place, so history can point to them without copying.

Mesh triangle counts from the same polygon with default settings:

| Subdivide level | Triangles |
|---|---|
| 0 | 932 |
| 1 | 3,728 |
| 2 | 14,912 |
| 3 | 59,648 |

## Library: build it ourselves
It should take about 150 lines in a new `src/store/history.ts`.
- **Immer** expects changes to go through its `produce`, but this store is edited directly, for example in `setPosition`.
- **VueUse's `useRefHistory`** mainly gives the undo/redo stacks, which are the easy part.

## What gets saved
Measured on a project of 50 shapes, 5 of them with the 14,912-triangle mesh:

| Approach | Cost per 100 steps |
|---|---|
| Clone the whole project | about 2.1 GB |
| Whole project as JSON strings | about 713 MB |
| **Only the changed shape's before and after** | **about 345 KB, or roughly half if records are shared between steps** |

```ts
type ShapeRecord = { geometry, extra, properties, polygon, mesh?, showRotation?, labelOffsets? };
type Change = { uid: string; before: ShapeRecord | null; after: ShapeRecord | null };
type Entry = { changes: Change[]; orderBefore?: string[]; orderAfter?: string[] };
```

- **Saving a step:** `commit()` compares the store with the last saved copy and records only the differences. The compare took about 0.09 ms for 50 shapes on plain objects; through Vue's proxies it should be a little slower.
- **Sharing records:** one step's `after` is the next step's `before` for that shape, so they can be the same object.
- **No-ops:** if nothing changed, no step is created, such as a click without a drag.
- **Missed call sites:** a forgotten `commit()` can't corrupt anything; that change just joins the next step. This is the main advantage over writing an inverse for every action.
- **Scope:** geometry, name, position, properties, polygon, mesh, rotation flag and label offsets. Selection, hover and zoom aren't included.
- **Limits:** keep 100 steps and about 500k triangles of old meshes, dropping the oldest first.
- **Redo:** a new commit clears the redo stack.
- **Import:** the history resets only after `loadProjectData` returns `ok`, so a failed import keeps it.

## When to save: no timer
A timer would split a drag into two steps if the user pauses mid-drag. Save when the action ends instead:

| Action | Save when |
|---|---|
| Drag a shape or label | Mouse up or mouse leave (`ShapesInteractionService`, `DimensionsWithTextLabelInteractionService`) |
| Modal Save | End of `confirmAddShape` |
| Delete | End of `onDelete` in `LeftPanel.vue` |
| Rotation checkbox | The setter in `ShapeCanvasPreview.vue` |
| Typing in the right panel | The input's `change` event (blur or Enter), after flushing the existing 500 ms write |
| Undo pressed with edits pending | Flush and commit first, so those edits are undone |

If a timer is ever wanted for typing, use about 1 second.

## Problems a simple undo would hit
Found by reading the code, not reproduced.

1. **Stale beams:** `GenericBeamView.ts:59` keeps a reference to the geometry object, so restoring a replacement object leaves the old one on screen. Re-importing a project with the same uids should already trigger this. A getter that reads from the store fixes both.
2. **Order after undoing a delete:** the shape would come back at the end of the list and on top of the others. Each history entry stores the order, and the beam collection gets re-sorted to match. That should also fix a beam jumping to the top when its shape changes kind.
3. **Wasted mesh copies:** `CustomShapeForm.vue:113` copies the mesh when the form opens, so a rename-only Save would keep a full duplicate in history. Dropping the copy is safe because nothing edits meshes.
4. **Late panel writes:** a pending `RightPanel.vue` write can land after an undo. It can also crash if the shape has been deleted, which is possible today too. `useDebounce` needs a `flush`.
5. **Empty number inputs:** clearing a position field stores `NaN`, which exports as `null`. The panel should skip that write, and history should copy values with a recursive function rather than a JSON round trip.
6. **Restoring must copy:** the store edits objects in place, so it gets a copy of each history record, except the mesh.

## Controls
- **Shortcuts:** Cmd/Ctrl+Z to undo, and Shift+Cmd/Ctrl+Z or Ctrl+Y to redo.
- **Inputs:** shortcuts are ignored while focus is in an input, so native text undo still works.
- **Blocked states:** undo and redo do nothing while the modal is open or during a drag.
- **Menu:** add an Edit menu with Undo and Redo, disabled when there's nothing to do. Only the can-undo and can-redo flags are reactive; the stacks stay plain arrays so Vue doesn't proxy them.
- **After a restore:** clear the selection or hover if that shape no longer exists.

## Build order
1. Fix problems 1, 3, 4 and 5 on their own.
2. Add `history.ts` and the `commit()` calls, including the ordering from problem 2.
3. Add the shortcuts and the Edit menu.
4. Optional, as a separate change: move meshes to `Float64Array`, with a new file version that still reads v2. `JSON.stringify` writes a typed array as an object, so export needs `Array.from`.

The repo has no test runner, so check it by running the app through each action, undo and redo.
