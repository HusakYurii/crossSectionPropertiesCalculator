# FEM mesh data improvement

## Why we want these changes
A FEM mesh can hold tens of thousands of triangles, and today each triangle is three `{x, y}` objects. That causes three problems:

- **Memory:** the mesh takes about 3× more memory than its coordinates need. After a project import it takes about 6× more, because imported triangles no longer share their points. Undo/redo history can also keep old meshes alive.
- **Project files:** every coordinate is written with its `x` and `y` keys, so an exported project is about twice as large as it needs to be.
- **Report limit:** report snapshots are stored in localStorage, which has a size limit. Large meshes are more likely to fail to save.

The planned copy/paste and Ctrl+D duplicate make this worse. In memory, a duplicate can share its source's mesh. But every copy is written in full to project files, report snapshots and the clipboard.

Storing each mesh as one flat array of numbers fixes all of this without changing any results: same triangles, same order, same section properties. A mesh is built once and never edited in place, so nothing needs point objects after meshing finishes. The cost is that code reading a mesh steps through it 6 numbers at a time.

## Summary
Store one flat array per mesh: `[x1, y1, x2, y2, x3, y3, ...]`, 6 numbers per triangle.

Measured on `h secion.csv`, subdivide level 2, 21,216 triangles:

| Layout | Memory |
|---|---|
| `Triangle[]` from the solver (points shared) | 3,196 KB |
| `Triangle[]` after a JSON import (nothing shared) | 6,133 KB |
| **Flat `number[]`, pre-sized** | **995 KB** |
| `Float64Array` | 1,012 KB |

Export drops from 4,078 KB to 2,048 KB, and the report snapshot from 1,361 KB to 698 KB.

We use a plain `number[]` rather than a `Float64Array`. It survives JSON as it is, and `copyPlainData` and `structuredClone` handle it with no special case.

**Out of scope, on purpose:**
- **`crossSectionPolygon`:** 5–82 points per shape, used in about 35–45 functions, and saved in project files, so changing it costs a lot and gains little.
- **`geometry.points`** of custom shapes.
- **Both undo systems:** they already handle the mesh by reference only.
- **The mesher's algorithms:** they need `Point` objects as `WeakMap` keys.
- **The short-lived `parts[]` array in `solve()`.**
- **The export's pretty-printing.**
- **`triangulateOldNoMemosAndOptimizations.ts`:** unused.

---

## Phase 0: tests first (mandatory gate)

**No mesh code changes until every item here is done:**
1. Any unrelated work in progress is committed, so this feature gets its own diff.
2. The tests below exist and pass against the **unmodified** `buildMesh` / `solve`.
3. The tests and their snapshot are committed.

**Rules during the rewrite (Phases 1 and 2):**
- **Never update or edit the snapshot.** Don't run the tests with `-u`, never edit the snapshot by hand, and never weaken an assertion to get a pass. A failure means the rewrite is wrong until proven otherwise.
- **Only `toFlat` may change.** It is the only test code allowed to change, and it is removed in Phase 2.
- **Report mesher bugs instead of fixing them.** If a test exposes an existing mesher bug, don't fix it here. Stop and report it. It only gets recorded with `it.fails` once agreed.

### Test setup
- **Runner:** add `vitest` as a dev dependency, in a version whose peer dependencies support Vite 8.2.1 (installed). Add a `"test": "vitest run"` script. The repo has no test runner today.
- **Environment:** use the default Node environment and the existing `vite.config.ts`. `crossSectionPolygonsBuilder` loads in plain Node, so no DOM library is needed.
- **Location:** `src/solvers/FEMCrossSectionPropertiesSolver.test.ts`.
- **Type-checking:** `tsconfig.app.json` includes `src/**/*.ts`, so `vue-tsc -b` type-checks the tests. Import `describe`/`it`/`expect` from `vitest` explicitly.
- **Test data:** load the CSVs from `src/testFiles/csv/` with Vite's `?raw` import, using 3 of them, `h secion.csv` among them.

### Test helpers (in the test file)
- **`toFlat(mesh)`** accepts `Triangle[]` or `number[]` and always returns flat coordinates, so the same tests run before and after the rewrite.
- **`hashCoordinates(flat)`** is an FNV-1a hash over each number's 8 bytes (`DataView`). It keeps the snapshot tiny and still detects any change to a value, the order or the winding.
- **`shapeFromCsv(raw)`** builds the polygon the way the form does: `convertCSVToPoints(raw, { decimals: 3, dropClosingPoint: true })`, then `crossSectionPolygonsBuilder.calculate(...)`.

### `buildMesh` tests

**A. Exact output (the main safety net).** For the 3 CSVs at subdivide levels 0–3 (12 cases), check `expect({ triangles, hash }).toMatchSnapshot()`. This locks in order and winding, which `solve()`'s floating-point sums depend on.

**B. Geometric correctness.** Run these on the 3 CSVs and on hand-written polygons (a triangle, a rectangle and a concave L-shape):
- The coordinate count is divisible by 6, and every value is finite.
- The sum of the triangle areas equals the polygon's shoelace area, within a relative tolerance of about 1e-9.
- Every vertex is inside or on the polygon.
- Every original polygon vertex appears in the mesh.
- The triangle count at level N is exactly `4^N ×` the count at level 0.

**C. Input handling.**
- An empty polygon gives an empty mesh, and so does one with fewer than 3 points.
- Consecutive duplicate points don't break it.
- Clockwise and counter-clockwise input both give a valid mesh.
- Open and closed rings both give a valid mesh. They may differ.
- The input polygon is not mutated.
- The same input gives the same output twice.

**D. Options (through `buildMesh`).**
- `{}` matches `DEFAULT_FEM_MESH_OPTIONS`.
- `NaN` or a non-number falls back to the default.
- `subdivideLevels`: `99` acts as 3, `-1` as 0, `1.4` as 1.
- `improvePasses: 0` gives a valid mesh.
- `maxSteinerPoints: 0` stops early, logs a `console.warn` (spied on) and returns a valid mesh.

### `solve` tests
- A `b × h` rectangle gives `A = bh`, `Ix = bh³/12`, `Iy = hb³/12` and `Ixy = 0`.
- Snapshot of `properties` for the 3 CSVs at levels 0–2.
- `calculate()` returns the same properties as `solve()`.
- An empty polygon returns `EMPTY_CROSS_SECTION_PROPERTIES`.

---

## Phase 1: mesher and solver

`buildMesh` changes only in its return type and last step. Resampling, ear clipping, edge flips and refinement stay on `Point` objects, because `KeyCache` is a `WeakMap<Point, string>`.

**`src/solvers/femTriangulator/triangulate.ts`**
- Add `export type Mesh = number[]` and `export const COORDS_PER_TRIANGLE = 6`. `Triangle` stays as the mesher's working type.
- Add `flattenTriangles(triangles: Triangle[]): Mesh`, pre-sized with `new Array(n * 6)`.
- Replace `subdivideTriangles` with `subdivideMesh(mesh: Mesh, levels: number): Mesh`. Keep the same child order per parent (`a,ab,ca` / `ab,b,bc` / `ca,bc,c` / `ab,bc,ca`) and the same `(p + q) / 2` midpoints. Pre-size each pass's output to `4 × input length`. `levels = 0` returns the input.

**`src/solvers/FEMCrossSectionPropertiesSolver.ts`**
- `buildMesh` returns `Mesh` and ends with `subdivideMesh(flattenTriangles(refined), settings.subdivideLevels)`.
- `solve` returns `{ properties, mesh }` instead of `{ properties, triangles }`.
- The triangle loop steps by `COORDS_PER_TRIANGLE` and fills one reused `[p1, p2, p3, p1]` ring of 3 reused point objects. This is safe because `calculateCrossSectionProperties` copies its input (`[...polygon].reverse()`) and returns only numbers.

**Gate:** all Phase 0 tests pass without touching the snapshot.

---

## Phase 2: consumers

| File | Change |
|---|---|
| `src/components/middle/view/beams/MeshView.ts` | Takes `Mesh`; the draw loop steps by 6 |
| `src/components/forms/customShape/composables/useFemCalculation.ts` | `shallowRef<Mesh>`; read `mesh` from `solve()` |
| `src/components/forms/customShape/composables/useCustomShapeCanvas.ts` | `Mesh` types (`mesh.length > 0` is still valid) |
| `src/components/forms/customShape/CustomShapeForm.vue` | Only types, if any |
| `src/components/top/CreateOrUpdateSectionDataModalWindow.vue` | `crossSectionMesh?: Mesh` (`mesh.length > 0` is still valid) |
| `src/pages/report/ReportShapeCanvas.vue` | `Mesh` type only |
| `src/store/store.ts` | `Record<UID, Mesh>` and the mesh comment. Keep `markRaw`, or a plain array gets a deep reactive proxy |
| `src/store/history.ts` | `ShapeRecord.mesh?: Mesh` and the `Set<Mesh>` types. **`_countOldMeshTriangles` must add `mesh.length / COORDS_PER_TRIANGLE`** |
| `src/pages/report/reportSnapshot.ts` | Rounding becomes `mesh.map(roundCoordinate)` |
| `src/store/projectFile.ts` | `PROJECT_FILE_VERSION = 2` (currently 1) |
| `src/store/storeDataImporter.ts` | Convert by file version in `readProject` (see below) |
| `src/exampleProjects/stiffened-skin-panel.json` | Re-save as a v2 file, with the mesh flat and rounded to 3 decimals as today |

- **The compiler won't catch the `history.ts` change.** `mesh.length` still type-checks, but it would count 6× too many triangles. Undo steps would then be dropped once the history holds about 83k triangles instead of 500k.
- **Old files.**
  - **When:** the conversion runs in `readProject`, before `replaceStoreData` / `resetStore()`, so a malformed old file fails without wiping the current project.
  - **How:** the file's version decides the conversion; the data's shape is never guessed. A missing or `1` version means each mesh goes through `flattenTriangles`, and `2` is read as is.
  - **Validation:** a mesh that isn't an array of 3-point triangles (v1) or of finite numbers with a length divisible by 6 (v2) rejects the import.
  - **Report snapshots:** old ones in localStorage go through the same path (`src/main.ts` → `loadProjectData`).
  - **Example projects:** check that `importExampleProject` also reaches `readProject`.
- **Exporter:** `storeDataExporter.ts` needs no change.
- **Copy/paste and duplicate (future work):** the paste code shares the source mesh by reference, because meshes are never edited in place. It copies every other group with `copyPlainData`, including the polygon, which `updateCrossSectionPolygon` edits in place and object snap recognises by array identity. `history.commit()` picks up the new uid without any extra code.
- **Clean-up:** remove the `Triangle[]` branch from the test helper `toFlat`.
- **New importer tests:**
  - A v1 file with one mesh loads as the expected flat array.
  - A v2 file loads unchanged.
  - A malformed mesh rejects the import and leaves the store untouched.

---

## Verification

**Automated**
1. `npm test`: all tests pass, and `git diff` on `__snapshots__` is empty.
2. `npm run build`: `vue-tsc -b` and the Vite build pass.
3. Re-run the memory measurement and confirm about 995 KB at level 2.

**In the app**
1. Custom shape: draw or import a CSV, calculate, and check the mesh draws correctly at subdivide levels 0 and 2.
2. Save, reopen the shape, and check the saved mesh shows straight away.
3. Export, then import: the mesh and results are unchanged.
4. Import a v1 project file saved before this change, and load the example projects.
5. Undo and redo across a recalculation, and check the mesh follows along.
6. Open the report and check the mesh draws, including with a large mesh.
