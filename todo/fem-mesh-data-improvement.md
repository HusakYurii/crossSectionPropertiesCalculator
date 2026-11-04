# FEM mesh data improvement

## Why we want these changes
A FEM mesh can hold tens of thousands of triangles, and today each triangle is three `{x, y}` objects. That causes three problems:

- **Memory:** the mesh takes about 3× more memory than its coordinates need, and about 6× after a project import, because imported triangles no longer share their points. Undo/redo history can also keep old meshes alive, which adds to this.
- **Project files:** every coordinate is written with its `x` and `y` keys, so an exported project is about twice as large as it needs to be.
- **Report limit:** report snapshots are stored in localStorage, which has a size limit. The same keys use up that space, so large meshes are more likely to fail to save.

Storing each mesh as one flat array of numbers fixes all three without changing any results: same triangles, same order, same section properties.

The mesh is built once and never edited in place, so nothing needs individual point objects after meshing finishes. The cost is that code reading a mesh must step through it 6 numbers at a time. Only two places do that: drawing and `solve()`.

## Summary
Store one flat array per mesh: `[x1, y1, x2, y2, x3, y3, ...]`, 6 numbers per triangle (the section is 2D, so there is no `z`).

Measured on `h secion.csv`, subdivide level 2, 21,216 triangles:

| Layout | Memory |
|---|---|
| `Triangle[]` from the solver (points shared) | 3,196 KB |
| `Triangle[]` after a JSON import (nothing shared) | 6,133 KB |
| `number[6][]` | 2,161 KB |
| **Flat `number[]`, pre-sized** | **995 KB** |
| `Float64Array` | 1,012 KB |

Export drops from 4,078 KB to 2,048 KB, and the report snapshot from 1,361 KB to 698 KB.

**Out of scope:** the short-lived `parts[]` array in `solve()` stays as it is. So do the mesher's algorithms, the export's pretty-printing and the unused `triangulateOldNoMemosAndOptimizations.ts`.

---

## Phase 0: tests first (mandatory gate)

**No mesh code changes until every item here is done.**

1. The undo/redo work is committed, so this feature gets its own diff.
2. The tests below exist and pass against the **unmodified** `buildMesh`.
3. The tests and their snapshot are committed.

**Rules during the rewrite (Phases 1 and 2):**
- Never run the tests with `-u`, and never edit the snapshot or weaken an assertion to get a pass. A failure means the rewrite is wrong until proven otherwise.
- The only test code that may change is the `toFlat` helper, which is removed in Phase 2.
- If a test exposes an existing mesher bug, don't fix it as part of this work. Stop and report it. It only gets recorded with `it.fails` once agreed.

### Test setup
- Add `vitest` as a dev dependency, in a version that supports Vite 8.2 (check its peer dependencies when installing), and a `"test": "vitest run"` script. The repo has no test runner today.
- Use the default Node environment and the existing `vite.config.ts`. `crossSectionPolygonsBuilder` already loads in plain Node, so no DOM library is needed for these tests.
- Tests live next to the code: `src/solvers/FEMCrossSectionPropertiesSolver.test.ts`.
- `tsconfig.app.json` includes `src/**/*.ts`, so `vue-tsc -b` type-checks the tests too. Import `describe`/`it`/`expect` from `vitest` explicitly. Load CSVs with Vite's `?raw` import, which the existing `vite/client` types cover.

### Test helpers (in the test file)
- `toFlat(mesh)` accepts `Triangle[]` or `number[]` and always returns flat coordinates. This lets the same tests run before and after the rewrite.
- `hashCoordinates(flat)` is a small FNV-1a over each number's 8 bytes (`DataView`). It keeps the snapshot tiny and still detects any change to a value, the order or the winding.
- `shapeFromCsv(raw)` builds the polygon the way the form does: `convertCSVToPoints(raw, { round: true, dropClosingPoint: true })`, then `crossSectionPolygonsBuilder.calculate(...)`.

### `buildMesh` tests

**A. Exact output (the main safety net).** For all 3 CSVs at subdivide levels 0, 1, 2 and 3 (12 cases):
`expect({ triangles, hash }).toMatchSnapshot()`. These also lock in order and winding, which `solve()`'s floating-point sums depend on.

**B. Geometric correctness.** These explain what broke when a hash fails, and they are checked on the same 3 CSVs and on hand-written polygons (triangle, rectangle, concave L-shape):
- The coordinate count is divisible by 6, and every value is finite.
- The sum of triangle areas equals the polygon's area (shoelace), within a relative tolerance of about 1e-9.
- Every vertex is inside or on the polygon. Together with the area check, this means no gaps and no overlaps.
- Every original polygon vertex appears in the mesh.
- Triangle count at level N is exactly `4^N ×` the count at level 0.

**C. Input handling.**
- Empty polygon, and fewer than 3 points, give an empty mesh.
- Consecutive duplicate points don't break it.
- Clockwise and counter-clockwise input both give a valid mesh.
- Open and closed rings both give a valid mesh. They may differ, because `buildMesh` skips the closing segment when measuring.
- The input polygon is not mutated (deep-equal before and after).
- The same input gives the same output twice.

**D. Options (`_resolveOptions`, tested through `buildMesh`).**
- `{}` matches `DEFAULT_FEM_MESH_OPTIONS`.
- `NaN` or a non-number falls back to the default.
- `subdivideLevels`: `99` acts as 3, `-1` as 0, `1.4` as 1.
- `improvePasses: 0` still gives a valid mesh.
- `maxSteinerPoints: 0` stops early, logs a `console.warn` (spied on) and still returns a valid mesh.

### `solve` tests
`solve()`'s loop is rewritten too, so it gets the same gate:
- Rectangle `b × h` matches the closed forms `A = bh`, `Ix = bh³/12`, `Iy = hb³/12`, `Ixy = 0`.
- Snapshot of `properties` for the 3 CSVs at levels 0–2.
- `calculate()` returns the same properties as `solve()`.
- An empty polygon returns `EMPTY_CROSS_SECTION_PROPERTIES`.

---

## Phase 1: mesher and solver

`buildMesh` changes only in its return type and last step. Resampling, ear clipping, edge flips and refinement stay on `Point` objects, because `KeyCache` is a `WeakMap<Point, string>` and numbers can't be `WeakMap` keys. Those steps build the same small mesh at every level, and only subdivision makes it grow, so that is where the data goes flat.

**`src/solvers/femTriangulator/triangulate.ts`**
- Add `export type Mesh = number[]` and `export const COORDS_PER_TRIANGLE = 6`. `Triangle` stays as the mesher's working type.
- Add `flattenTriangles(triangles: Triangle[]): Mesh`, pre-sized with `new Array(n)`.
- Replace `subdivideTriangles` with `subdivideMesh(mesh: Mesh, levels: number): Mesh`, with the same output order (`a,ab,ca` / `ab,b,bc` / `ca,bc,c` / `ab,bc,ca`) and the same `(p + q) / 2` midpoints.

**`src/solvers/FEMCrossSectionPropertiesSolver.ts`**
- `buildMesh` returns `Mesh` and ends with `subdivideMesh(flattenTriangles(refined), settings.subdivideLevels)`.
- `solve` returns `{ properties, mesh }` instead of `{ properties, triangles }`.
- The loop steps by `COORDS_PER_TRIANGLE` and fills one reused `[p1, p2, p3, p1]` ring. This is safe because `calculateCrossSectionProperties` copies its input and returns only numbers.

**Gate:** all Phase 0 tests pass without touching the snapshot, before moving on.

---

## Phase 2: consumers

| File | Change |
|---|---|
| `src/components/middle/view/beams/MeshView.ts` | Takes `Mesh`; the draw loop steps by 6 |
| `src/components/top/forms/CustomShapeForm.vue` | `Mesh` types; read `mesh` from `solve()` |
| `src/components/top/CreateOrUpdateSectionDataModalWindow.vue` | `Mesh` types |
| `src/store/store.ts` | `Mesh` types and the mesh comment. Keep `markRaw`: a plain array would otherwise get a deep reactive proxy |
| `src/store/history.ts` | `Mesh` types. **`_countOldMeshTriangles` must use `mesh.length / COORDS_PER_TRIANGLE`** |
| `src/report/reportSnapshot.ts` | `store.crossSectionMesh[uid].map(roundCoordinate)` |
| `src/store/projectFile.ts` | `PROJECT_FILE_VERSION = 3` |
| `src/store/storeDataImporter.ts` | v3 reads as is; v1 and v2 go through `flattenTriangles` |
| `todo/undo-redo-history.md` | Build order step 4: flat `number[]`, not `Float64Array` |

- **The compiler won't catch the `history.ts` change.** `mesh.length` still type-checks but would count 6× too many triangles, so undo steps would be dropped far too early.
- **Old files:** the conversion is chosen by file version, not by guessing the data's shape. It runs inside `normalizeProject`, before `replaceStoreData`, so a malformed old file fails without wiping the current project. Old report snapshots in localStorage go through the same path (`src/main.ts` calls `loadProjectData`).
- **Exporter:** `storeDataExporter.ts` needs no change.
- **Clean-up:** remove the `Triangle[]` branch from the test helper `toFlat`.
- **New importer test:** a v2 file with one mesh loads as the expected flat array, and a v3 file loads unchanged.

---

## Verification

**Automated**
1. `npm test`: all tests pass and the snapshot file has no diff (`git diff` on `__snapshots__` is empty).
2. `npm run build`: `vue-tsc -b` and the Vite build pass.
3. Full comparison against the pre-rewrite baseline. It is a temporary 18 MB file in the scratchpad, covering every coordinate and property for the 3 CSVs at levels 0–3, and must match with strict equality. If the file is gone, the snapshot hashes still cover this.
4. Re-run the memory measurement and confirm about 995 KB at level 2.

**In the app**
1. Custom shape: draw or import a CSV, calculate, and check the mesh draws correctly at subdivide levels 0 and 2.
2. Save, reopen the shape, and check the saved mesh shows straight away.
3. Export, then import: the mesh and results are unchanged.
4. Import a v2 project file saved before this change.
5. Undo and redo across a recalculation, and check the mesh follows along.
6. Open the report and check the mesh draws, including with a large mesh.
