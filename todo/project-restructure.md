# Project restructure: dependency map and feature-based layout proposal

> Status: proposal. No code has been changed yet.
> Source: static import analysis of `src/` (274 files) on 2026-11-25.
> All paths are relative to `src/`.

## 0. TL;DR

- The code is grouped by **UI position** (`components/left|top|middle|right`), not by feature. The result is about 60 cross-folder deep imports.
- The real backbone is a **canvas rendering engine** buried in `components/middle/view/`. View, the section forms, the custom shape editor and the report all deep-import it. It has to move to `shared/canvas/` **before** any feature can be split cleanly.
- The **solvers are almost clean**: no Vue, no components. The leaks are `vue3-toastify`, `composables/useDebounce`, the `Store` type in the composite solver, and the `Triangle` type that store and UI import from solver internals. The solvers stay a top-level layer (`src/solvers/`) with a public `index.ts`.
- The **section editor modal** (`top/CreateOrUpdateSectionDataModalWindow.vue`) is not part of TopBar. The TopBar Shapes menu and the Left panel Edit action both open it through `store/sectionModal`. It belongs with the forms as its own feature.
- Shape metadata (`forms/*/fields.ts`, `staticAnnotations.ts`, `shapeRegistry.ts`) is also used by the report, so it should become a shared **shape definition** module.
- There is **no `@/` alias**, no router and no tests. Add the alias first, or every move turns into a relative-path rewrite.
- Dead code: `components/right/RightPanel.vue` (not mounted), `solvers/femTriangulator/triangulateOldNoMemosAndOptimizations.ts`, `svg/overlays-focus.svg`, `images/logo.png`, `testFiles/` (fixtures inside `src/`), and `.DS_Store` files.

---

## 1. Global services (logic not tied to UI)

| Module | Singleton / exports | Consumers | Notes |
|---|---|---|---|
| `services/NativeHotKeysService.ts` | `nativeHotKeysService`, `isEditingNativeInputsNow`, `isImeComposing`, `hasModKey`, `HOT_KEYS`… | App, composables (useHotKey, useModalKeyboard), left, top/EditMenu, view/ObjectSnapInteractionService, customShape (PointsList, PolygonEditor) | Type cycle with `constants/hotKeysLabels.ts`; move them together |
| `services/OperatingSystemService.ts` | `operatingSystemService` | NativeHotKeysService only | internal to hotkeys |
| `services/eventBus.ts` | `eventBus` (only event: `projectLoaded`) | top/FilesMenu emits, view/View.vue listens | shared |
| `solvers/CrossSectionPolygonsBuilder.ts` | `crossSectionPolygonsBuilder` | forms/useCrossSectionPropertiesSolver, customShape/useFemCalculation | uses toast + useDebounce |
| `solvers/CrossSectionPropertiesSolver.ts` | `crossSectionPropertiesSolver` | forms/useCrossSectionPropertiesSolver | uses toast + useDebounce |
| `solvers/FEMCrossSectionPropertiesSolver.ts` | `femCrossSectionPropertiesSolver` | customShape/useFemCalculation, CustomShapePropertiesStrategy | |
| `solvers/CompositeCrossSectionPropertiesSolver.ts` | `compositeCrossSectionPropertiesSolver` | view/useQuickSolverOverlays, top/FilesMenu, report/ReportPage | takes the `Store` type; `calculate()` toasts |
| `store/history.ts` | `history` (app undo/redo) | App, left, top, view, forms, store/* | depends on `sectionModal` (UI state) |
| `store/storeDataImporter.ts`, `storeDataExporter.ts`, `projectFile.ts` | project persistence | main.ts, top/FilesMenu, top/SaveProjectModal, report/reportSnapshot | importer calls toast |
| `fileLoader/*` | `downloadCsv/Text/Image`, `uploadCsv/JSON`, `sanitizeFileName`, MIME constants | store exporter, top/FilesMenu, customShape/csv, modals/ConfirmSaveFileModal | pure browser I/O |
| `mathUtils/{anglesMath,round,snap,gridSpacing}` | pure math | solvers, forms, view, report | `gridSpacing` is view only |
| `utils/plainData.ts` | `copyPlainData`, `isSamePlainData` | store/*, useLocalHistory, useFemCalculation | |

Feature-level services (not global): `components/middle/view/services/*` (Input, CanvasTransform, Resize, ShapesInteraction, DimensionsWithTextLabelInteraction, ObjectSnapInteraction) and `forms/customShape/drawUtils/PolygonEditor.ts`. All of them are DOM/canvas bound. **Input, CanvasTransform and Resize** form a reusable canvas engine; the other three are specific to the main view.

## 2. Top-level composables (`src/composables/`)

| Composable | Consumers | Verdict |
|---|---|---|
| `useDebounce` | forms/ShapeCanvasPreview, right (dead), **solvers** (2) | Pure TS, not a composable. Move to `shared/utils/debounce.ts` |
| `useEditorPanelsResize` | App.vue only | Move to `app/` |
| `useHotKey` | App, customShape/CustomShapeForm | `shared/composables` |
| `useLocalHistory` | customShape/CustomShapeForm only | Generic; keep in `shared/composables` |
| `useModalKeyboard` | modals/ConfirmSaveFileModal, top/ConfirmModal, top/CreateOrUpdate…Modal, info/InfoPanel | `shared/composables` (part of the BaseModal kit) |

Feature-local composables already exist:
- `left/composables/{useListItemDrag, useRenameListItem}`: generic, so candidates for `shared/composables`
- `view/composables/{useDimensionsWithTextLabelEdit, useQuickSolverOverlays}`
- `view/quickActions/snap/useSnapControl`
- `forms/composables/{useStoreGeometryWatcher, useSimpleFormSolver, useCrossSectionPropertiesSolver}`
- `forms/customShape/composables/{useCustomShapeCanvas, useCustomShapeCsv, useFemCalculation}`

## 3. Store (`src/store/`)

These are module-level reactive singletons (no Pinia). Import graph (no runtime cycles):

```
appSessionState  (leaf)
├─ store            → appSessionState
├─ sectionModal     → appSessionState
├─ shapeRecord      → store, appSessionState
├─ history          → store, appSessionState, sectionModal, shapeRecord
├─ shapeClipboard   → history, shapeRecord, store, appSessionState
├─ storeDataImporter→ history, store, appSessionState, projectFile
├─ storeDataExporter→ store, appSessionState, projectFile, fileLoader
└─ projectFile      → store, appSessionState (types)
infoPanel (standalone), exampleProjects (static registry, not state)
```

- `store.ts` and `appSessionState.ts` are each imported by about 25 files. They stay a global layer.
- `appSessionState` mostly holds **view** state: snapping, toggles, label offsets, hatching.
- `exampleProjects.ts` is a static registry used only by top/FilesMenu → move it to the TopBar feature.

## 4. Solvers (`src/solvers/`)

```
solvers/
├─ CrossSectionPolygonsBuilder.ts ──► polygonStrategies/index (11 strategies + Abstract)
│                                     └─► poligonUtils/{buildArcPoints, rotatePoint, removeDuplicatePoints}
├─ CrossSectionPropertiesSolver.ts ─► propertyStrategies/index (11 strategies + Abstract)
│                                     ├─► propertyStrategies/greenTheoremCalculator.ts (core math)
│                                     ├─ CustomShapePropertiesStrategy ──► FEMCrossSectionPropertiesSolver   (layer inversion)
│                                     └─ HollowRectanglePropertiesStrategy ──► polygonStrategies/HollowRectangleStrategy (sideways)
├─ FEMCrossSectionPropertiesSolver.ts ─► femTriangulator/triangulate.ts (760 lines), greenTheoremCalculator
├─ CompositeCrossSectionPropertiesSolver.ts ─► greenTheoremCalculator, type Store
└─ femTriangulator/triangulateOldNoMemosAndOptimizations.ts   ← DEAD (879 lines)
External: interfaces/{common,beams,sectionProperties,FEMMeshOptions}, mathUtils/anglesMath,
          constants/geometryTolerances, vue3-toastify (!), composables/useDebounce (!), store type (!)
```

**Who reaches into solver internals (deep imports to remove):**
- `view/beams/GenericBeamView` → `poligonUtils/polygonIntersectionMath`
- `view/beams/HollowRectangleBeam` → `polygonStrategies/HollowRectangleStrategy`
- `forms/components/annotationFrame` → `poligonUtils/rotatePoint`
- `store/{store,history,shapeRecord}`, `view/beams/MeshView`, `top/CreateOrUpdate…`, `customShape/*` → `femTriangulator/triangulate` (mostly the `Triangle` type)

**Target:** a framework-free layer whose only entry is `solvers/index.ts`. The steps are listed in §7, phase 1.

## 5. Constants and interfaces: who owns them

| File | Used by | Destination |
|---|---|---|
| `constants/canvasStyle.ts` | view (24 files), report, customShape | `shared/canvas/canvasStyle.ts`; `POLYGON_EDITOR_STYLE` → customShape |
| `constants/canvasInteraction.ts` | view services, customShape, mathUtils/snap, appSessionState | `shared/canvas/canvasInteraction.ts`; `POLYGON_EDITOR_INTERACTION` → customShape; `OBJECT_SNAP`, `DRAG_THRESHOLD` → view |
| `constants/canvasFit.ts` | split per export | `MAIN_VIEW_FIT` → view; `CUSTOM_SHAPE_EDITOR_VIEW` → customShape; `REPORT_SECTION_CANVAS`, `RENDER_SCALE` → report; `SHAPE_PREVIEW_FIT` → shared/canvas (forms + report) |
| `constants/geometryTolerances.ts` | mostly solvers | `solvers/tolerances.ts` (export `POLYGON_LIMITS` publicly); `PRINCIPAL_COINCIDE_EPS` → shared/canvas/propertiesHelperPreviews |
| `constants/hotKeysLabels.ts` | NativeHotKeysService only | `shared/services/hotkeys/` |
| `constants/shapeClipboard.ts` | store/shapeClipboard only | inline next to shapeClipboard |
| `interfaces/common/types.ts` | 81 files | `shared/types/geometry.ts` (Point, Polygon, BoundingBox) + `shared/canvas/types.ts` (Drawable, DrawTarget, Detectable) |
| `interfaces/beams/*`, `shapeLabels.ts` | forms, solvers, view, store, report | `shared/shapes/` (domain types) |
| `interfaces/sectionProperties`, `FEMMeshOptions` | solvers, store, forms, report | `shared/types/` (or exported from solvers) |
| `interfaces/annotations/DimensionSource.ts` | view only; **imports a component file and the store** (cycle) | `shared/canvas/annotations/`; move `ArrowAxis` into it |
| `interfaces/menu/menu.types.ts` | top/menu only | `features/top-bar/menu/` |
| `interfaces/quickSolverToggles.ts`, `snapOptionsToggles.ts` | view + appSessionState | `features/view/model/` (store imports the types) |
| `docs/*.md` | info pages only | `features/info/docs/` |
| `svg/*` | mostly view or left only; `undo`/`redo` shared | per feature `assets/`; `undo`/`redo` → `shared/assets/icons` |
| `exampleProjects/*.json` | top/FilesMenu via store/exampleProjects | `features/top-bar/exampleProjects/` |

## 6. Feature dependency trees (current state)

Legend: `[EXT]` = import from a global folder, `[XF]` = deep import into another feature (a coupling point).

### 6.1 App shell
```
main.ts ── ?report=<id> ? ReportPage.vue (separate createApp) : App.vue
App.vue
├─ top/TopPanel.vue, left/LeftPanel.vue, middle/view/View.vue, pages/info/InfoPanels.vue
├─ (commented out) right/RightPanel.vue
├─ store/{infoPanel, sectionModal, shapeClipboard, history}
├─ composables/{useHotKey, useEditorPanelsResize}
├─ services/NativeHotKeysService
└─ DOM teleport targets: .modals-container (z 100), .info-page-container (z 200)
```

### 6.2 Left panel
```
left/LeftPanel.vue
├─ ./composables/useListItemDrag.ts        (generic)
├─ ./composables/useRenameListItem.ts ── [EXT] services/NativeHotKeysService
├─ [EXT] store/{store, appSessionState, history, sectionModal → opens section editor}
├─ [EXT] svg/{trash, edit}.svg
└─ [EXT] interfaces/beams/common.types
```
Clean: no direct cross-feature imports.

### 6.3 TopBar
```
top/TopPanel.vue
├─ ./CreateOrUpdateSectionDataModalWindow.vue   ← belongs to section-editor (see 6.6)
├─ menu/FilesMenu.vue
│  ├─ MenuWithNestedDropDown → NestedMenuList
│  ├─ ../ConfirmModal.vue (generic)          ── composables/useModalKeyboard
│  ├─ ../SaveProjectModal.vue ── [XF] modals/ConfirmSaveFileModal
│  ├─ [EXT] store/{store, history, storeDataImporter, storeDataExporter, exampleProjects}
│  ├─ [EXT] fileLoader/uploadFile, solvers/CompositeCrossSectionPropertiesSolver
│  ├─ [XF]  pages/report/reportSnapshot (createReportSnapshot, saveReportSnapshot)
│  └─ [EXT] services/eventBus ('projectLoaded' → View)
├─ menu/EditMenu.vue ── MenuWithDropDown; store/{history, appSessionState, shapeClipboard}; NativeHotKeysService; svg/undo|redo
├─ menu/ShapesMenu.vue ── store/sectionModal (openSectionModal)
└─ menu/HelpMenu.vue ── store/infoPanel (openInfoPanel)
   all menus ── [EXT] interfaces/menu/menu.types
```

### 6.4 View (main canvas)
```
middle/view/View.vue
├─ services/{ShapesInteraction, DimensionsWithTextLabelInteraction, ObjectSnapInteraction}Service   ← view-specific
├─ services/{Input, CanvasTransform, Resize}Service                                                 ← ENGINE
├─ canvas/{Canvas, CanvasScene, DrawTargetsCollection, BeamsDrawTargetCollection, drawUtils, CrossHatch} ← ENGINE
├─ canvas/annotations/{BaseDimensions, DimensionsWithLabel, DimensionsWithTextLabel, LeaderWithArrow, LeaderWithDot} ← ENGINE
├─ canvas/annotations/dimensionSources/{ShapeDimensionSource (also report), CompositeCentroidDimensionSource}
├─ canvas/compositeSection/CompositeSectionOverlays        ← view-specific
├─ canvas/objectSnap/{ObjectSnapMarkers, shapeVertices}    ← view-specific
├─ canvas/propertiesHelperPreviews/* (PropertyOverlays…)   ← ENGINE (view, forms, customShape, report)
├─ beams/{GenericBeamView, HollowRectangleBeam, HollowTubeBeam, MeshView, createBeamView} ← ENGINE
│     └─ [EXT] solvers/poligonUtils/polygonIntersectionMath, solvers/polygonStrategies/HollowRectangleStrategy,
│              solvers/femTriangulator (Triangle), store/store (GenericBeamView writes geometryExtra.position!)
├─ shapes/{Grid, MainAxis, ScaleBar}                       ← ENGINE
├─ composables/{useDimensionsWithTextLabelEdit, useQuickSolverOverlays → solvers/Composite + toast}
├─ quickActions/{QuickActionsBar, QuickActionButton, QuickToggleDropdown, QuickActionsDivider,
│                ViewQuickActions + canvasViewActions, HistoryQuickActions, snap/SnapControl}  ← UI KIT (view + customShape)
│     └─ snap/SnapControl ── [XF] forms/components/StyledSelectWrapper.vue
├─ quickActions/{HatchingToggle, ObjectSnapActions, QuickSolverActions}  ← view-specific
└─ [EXT] store/{store, appSessionState, history}, services/eventBus, mathUtils/{snap, gridSpacing, anglesMath, round},
         constants/{canvasStyle, canvasFit, canvasInteraction, geometryTolerances},
         interfaces/{common, beams, sectionProperties, quickSolverToggles, snapOptionsToggles, annotations}, svg/*
```

### 6.5 Section forms (standard shapes)
Each of C, I, L, T, Z, Rect, HollowRect and Tube follows the same three-file pattern:
```
forms/<x>Section/
├─ <X>SectionForm.vue
│  ├─ ../components/{SectionShapeLayout, ShapeCanvasPreview, IsNegativeField, SectionField}
│  ├─ ../composables/useStoreGeometryWatcher   (deep-copy draft from store.geometry[uid])
│  ├─ ../composables/useSimpleFormSolver → useCrossSectionPropertiesSolver → solvers/{PolygonsBuilder, PropertiesSolver}
│  └─ defineExpose({ geometry, crossSectionProperties, crossSectionPolygon })   ← modal reads it and writes the store
├─ fields.ts               (ShapeField<G>[] metadata; also used by the report via shapeRegistry)
└─ staticAnnotations.ts    ── ../components/annotationFrame, [XF] middle/view/canvas/annotations/*, DrawTargetsCollection
forms/components/
├─ ShapeCanvasPreview.vue  ── [XF] middle/view/{canvas, beams, shapes, propertiesHelperPreviews, services/ResizeService}
│                             [EXT] store/{store, sectionModal, history, appSessionState}, composables/useDebounce
├─ shapeRegistry.ts        (all fields + annotations; used by ShapeCanvasPreview and report)
├─ annotationFrame.ts      ── [EXT] solvers/poligonUtils/rotatePoint
├─ SectionPropertiesTable.vue (also report), IsNegativeField (→ store/infoPanel), StyledSelectWrapper (also view)
└─ SectionField, ButtonField, SectionShapeLayout, PlaceholderSectionForm  (pure UI)
```
Forms never write to the store. Only the host modal does.

### 6.6 Section editor modal (currently under top/)
```
top/CreateOrUpdateSectionDataModalWindow.vue   (opened via store/sectionModal by ShapesMenu [new] and LeftPanel [edit])
├─ [XF] all 9 forms + forms/components/{PlaceholderSectionForm, SectionPropertiesTable}
├─ [EXT] store/{sectionModal, store, appSessionState, history, infoPanel}
├─ [EXT] composables/useModalKeyboard
├─ [EXT] interfaces/beams/{common.types, shapeLabels}, interfaces/sectionProperties
└─ [EXT] solvers/femTriangulator/triangulate (Triangle type)
```

### 6.7 Custom shape (sub-feature of forms; 13 files, about 1,700 lines)
```
forms/customShape/CustomShapeForm.vue
├─ [XF] middle/view/quickActions/{SnapControl, QuickActionsBar, QuickActionsDivider, ViewQuickActions, HistoryQuickActions}
├─ ../components/{IsNegativeField, ButtonField}, ../composables/useStoreGeometryWatcher
├─ CustomShapePointsList.vue ── constants/geometryTolerances, mathUtils/round, NativeHotKeysService
├─ FemMeshSettings.vue + fields.ts (FEM_OPTION_FIELDS, also used by report)
├─ csv/{SaveCustomShapeCSVFileModal → [XF] modals/ConfirmSaveFileModal, csvTextParser (pure), exportCsvPoints, pickCsvPoints}
├─ composables/useFemCalculation ── solvers/{PolygonsBuilder, FEM, femTriangulator}, store/store, toast
├─ composables/useCustomShapeCsv ── fileLoader, store/infoPanel
├─ composables/useCustomShapeCanvas ── [XF] middle/view/{canvas/*, shapes, beams/MeshView, propertiesHelperPreviews, quickActions/canvasViewActions}
├─ drawUtils/PolygonDrawTarget ── [XF] middle/view/canvas/{DrawTargetsCollection, drawUtils}
├─ drawUtils/PolygonEditor ── [XF] middle/view/services/{CanvasTransformService, InputService}
└─ [EXT] composables/{useLocalHistory, useHotKey}, mathUtils/snap, store/{appSessionState, infoPanel}
```
It is big enough to be **its own feature**.

### 6.8 Modals
| Modal | Opened by | Destination |
|---|---|---|
| `modals/ConfirmSaveFileModal.vue` | top/SaveProjectModal, customShape/csv/SaveCustomShapeCSVFileModal | `shared/components/modals/` |
| `top/ConfirmModal.vue` | top/FilesMenu (New / Import / Open example) | `shared/components/modals/` (generic) |
| `top/SaveProjectModal.vue` | top/FilesMenu (Export) | `features/top-bar/modals/` |
| `top/CreateOrUpdateSectionDataModalWindow.vue` | ShapesMenu + LeftPanel via store/sectionModal | `features/section-editor/` |

Three modals duplicate the `.modal-overlay/.modal/.modal-header/.modal-btn` CSS, the Teleport and the focus return. Extract a `shared/components/modals/BaseModal.vue`.

### 6.9 Info pages
```
pages/info/InfoPanels.vue → 8 × WhatIs*.vue / AboutThisApp / NavigationAndShortcuts
   each: defineAsyncComponent(import('docs/*.md')) inside InfoPanel.vue (drawer, Teleport .info-page-container)
   ── store/infoPanel, composables/useModalKeyboard, Spinner.vue
Opened via store/infoPanel by: HelpMenu, section editor modal, forms/IsNegativeField, customShape/useCustomShapeCsv
```

### 6.10 Report
```
pages/report/ReportPage.vue   (separate app, ?report=<id>)
├─ ReportSectionCanvas.vue ── [XF] middle/view/{canvas, annotations, dimensionSources/ShapeDimensionSource,
│                                  propertiesHelperPreviews, beams, shapes}; constants/{canvasStyle, canvasFit}
├─ ReportShapeCanvas.vue   ── [XF] same engine + forms/components/shapeRegistry (buildAnnotations)
├─ renderStaticScene.ts    ── [XF] middle/view/canvas/Canvas
├─ ShapeParametersTable    ── [XF] forms/components/shapeRegistry (SHAPE_FIELDS)
├─ FemSettingsTable        ── [XF] forms/customShape/fields (FEM_OPTION_FIELDS)
├─ [XF] forms/components/SectionPropertiesTable.vue
├─ solvers/CompositeCrossSectionPropertiesSolver, store/store
└─ reportSnapshot.ts ── store/{storeDataExporter, projectFile, store}  (localStorage `cspc-report:<ts>`, keeps last 3)
Print: window.print() + @media print + .report-mode / .no-print
```

### 6.11 Coupling hot spots (summary)
1. **forms → middle/view**: about 50 imports (the canvas engine, annotations, the quickActions UI kit).
2. **report → middle/view + forms**: the canvas engine, shapeRegistry, SectionPropertiesTable, customShape/fields.
3. **top → forms**: the section editor modal sits in the wrong feature.
4. **top → report**: FilesMenu imports `reportSnapshot`.
5. **middle → forms**: SnapControl imports StyledSelectWrapper.
6. **interfaces → components**: `DimensionSource.ts` imports `DimensionsWithTextLabel` (type cycle).
7. **solvers → UI**: toast and useDebounce; the Composite solver takes `Store`.
8. **store → UI state**: history depends on sectionModal; the importer toasts.
9. **view/beams/GenericBeamView writes to the store directly** (`geometryExtra.position`).

---

## 7. Proposed structure

### 7.1 Layers and dependency rules

```
app  ──►  features  ──►  store  ──►  solvers  ──►  shared
                  └──────────────────►─────────────┘
```
- `shared/` imports nothing above it. It has no store and no feature code; Vue-only utilities are allowed.
- `solvers/` imports only `shared/types`, `shared/shapes` (types) and `shared/math`. It has **no Vue, no toast and no store**.
- `store/` may import solver types and `shared/`.
- A feature imports `store/`, `solvers/` (through `solvers/index.ts` only) and `shared/`. **A feature never deep-imports another feature.** If something is needed across features, either move it to `shared/` or expose it from the feature's `index.ts`; the latter is allowed only for orchestration, e.g. `report` exporting `createReportSnapshot`.
- Enforce the rules with `eslint-plugin-boundaries` (or `import/no-restricted-paths`) and an `@/` alias.

### 7.2 Folder tree

```
src/
├─ app/
│  ├─ main.ts
│  ├─ App.vue
│  ├─ useEditorPanelsResize.ts
│  └─ styles/{style.css, markdown.css}
│
├─ features/
│  ├─ top-bar/
│  │  ├─ TopPanel.vue
│  │  ├─ menu/{FilesMenu, EditMenu, ShapesMenu, HelpMenu}.vue
│  │  ├─ menu/components/{MenuWithDropDown, MenuWithNestedDropDown, NestedMenuList}.vue
│  │  ├─ menu/menu.types.ts
│  │  ├─ modals/SaveProjectModal.vue
│  │  ├─ exampleProjects/{index.ts, *.json}
│  │  └─ index.ts                      (exports TopPanel)
│  │
│  ├─ left-panel/
│  │  ├─ LeftPanel.vue
│  │  ├─ assets/{trash, edit}.svg
│  │  └─ index.ts
│  │
│  ├─ view/                            (main editor canvas: interaction + overlays only)
│  │  ├─ View.vue
│  │  ├─ services/{ShapesInteraction, DimensionsWithTextLabelInteraction, ObjectSnapInteraction}Service.ts
│  │  ├─ objectSnap/{ObjectSnapMarkers, shapeVertices}.ts
│  │  ├─ compositeSection/{CompositeSectionOverlays, CompositeCentroidDimensionSource}.ts
│  │  ├─ composables/{useDimensionsWithTextLabelEdit, useQuickSolverOverlays}.ts
│  │  ├─ quickActions/{HatchingToggle, ObjectSnapActions, QuickSolverActions}.vue
│  │  ├─ model/{quickSolverToggles, snapOptionsToggles}.ts
│  │  ├─ constants.ts                  (MAIN_VIEW_FIT, OBJECT_SNAP, DRAG_THRESHOLD)
│  │  ├─ utils/gridSpacing.ts          (if Grid stays in shared, keep with Grid)
│  │  ├─ assets/*.svg
│  │  └─ index.ts
│  │
│  ├─ section-editor/                  (the create/edit modal + standard forms)
│  │  ├─ SectionEditorModal.vue        (was top/CreateOrUpdateSectionDataModalWindow.vue)
│  │  ├─ forms/{CSection, ISection, LSection, TSection, ZSection, RectSection, HollowRectSection, TubeSection}Form.vue
│  │  ├─ components/{SectionShapeLayout, ShapeCanvasPreview, PlaceholderSectionForm}.vue
│  │  ├─ composables/{useSimpleFormSolver, useCrossSectionPropertiesSolver}.ts
│  │  └─ index.ts                      (exports SectionEditorModal)
│  │
│  ├─ custom-shape/
│  │  ├─ CustomShapeForm.vue
│  │  ├─ components/{CustomShapePointsList, FemMeshSettings}.vue
│  │  ├─ composables/{useCustomShapeCanvas, useCustomShapeCsv, useFemCalculation}.ts
│  │  ├─ editor/{PolygonEditor, PolygonDrawTarget}.ts
│  │  ├─ csv/{csvTextParser, exportCsvPoints, pickCsvPoints}.ts
│  │  ├─ modals/SaveCustomShapeCSVFileModal.vue
│  │  ├─ constants.ts                  (CUSTOM_SHAPE_EDITOR_VIEW, POLYGON_EDITOR_STYLE, POLYGON_EDITOR_INTERACTION)
│  │  └─ index.ts                      (exports CustomShapeForm)
│  │
│  ├─ info/
│  │  ├─ InfoPanels.vue, InfoPanel.vue
│  │  ├─ pages/*.vue                   (WhatIs*, AboutThisApp, NavigationAndShortcuts)
│  │  ├─ docs/*.md
│  │  └─ index.ts
│  │
│  └─ report/
│     ├─ ReportPage.vue
│     ├─ components/{ReportSectionCanvas, ReportShapeCanvas, ShapeParametersTable, FemSettingsTable}.vue
│     ├─ renderStaticScene.ts
│     ├─ reportSnapshot.ts
│     ├─ constants.ts                  (REPORT_SECTION_CANVAS, RENDER_SCALE)
│     └─ index.ts                      (exports ReportPage, createReportSnapshot, saveReportSnapshot, loadReportSnapshot)
│
├─ store/                              (global app state; unchanged role)
│  ├─ store.ts, appSessionState.ts, history.ts, shapeRecord.ts, shapeClipboard.ts
│  ├─ ui/{sectionModal, infoPanel}.ts  (cross-feature UI open/close state)
│  └─ persistence/{projectFile, storeDataImporter, storeDataExporter}.ts
│
├─ solvers/                            (stays top-level; framework-free domain core)
│  ├─ index.ts                         (the ONLY public entry)
│  ├─ CrossSectionPolygonsBuilder.ts, CrossSectionPropertiesSolver.ts,
│  │  FEMCrossSectionPropertiesSolver.ts, CompositeCrossSectionPropertiesSolver.ts
│  ├─ polygon/                         (was poligonUtils: buildArcPoints, rotatePoint, removeDuplicatePoints, intersection)
│  ├─ polygonStrategies/
│  ├─ propertyStrategies/              (+ greenTheoremCalculator.ts)
│  ├─ fem/                             (was femTriangulator; triangulate.ts, mesh.types.ts with Triangle)
│  ├─ errors.ts                        (SolverError / Result type instead of toast)
│  └─ tolerances.ts                    (was constants/geometryTolerances)
│
└─ shared/
   ├─ canvas/                          (rendering engine used by view, section-editor, custom-shape, report)
   │  ├─ core/{Canvas, CanvasScene, DrawTargetsCollection, BeamsDrawTargetCollection, drawUtils, CrossHatch}.ts
   │  ├─ services/{InputService, CanvasTransformService, ResizeService}.ts
   │  ├─ annotations/{BaseDimensions, DimensionsWithLabel, DimensionsWithTextLabel, LeaderWithArrow, LeaderWithDot,
   │  │               DimensionSource, ShapeDimensionSource}.ts
   │  ├─ beams/{GenericBeamView, HollowRectangleBeam, HollowTubeBeam, MeshView, createBeamView}.ts
   │  ├─ primitives/{Grid, MainAxis, ScaleBar}.ts
   │  ├─ propertiesHelperPreviews/*
   │  ├─ canvasStyle.ts, canvasInteraction.ts, canvasFit.ts (SHAPE_PREVIEW_FIT)
   │  ├─ types.ts                      (Drawable, DrawTarget, Detectable)
   │  └─ index.ts
   ├─ shapes/                          (shape definition registry; domain metadata)
   │  ├─ types/{common, CSection, ISection, LSection, TSection, ZSection, OSection, RectSection, CustomShape}.types.ts
   │  ├─ <shape>/{fields.ts, staticAnnotations.ts}   (moved from forms/<x>Section/)
   │  ├─ annotationFrame.ts, shapeField.ts, shapeLabels.ts
   │  ├─ femFields.ts                  (FEM_OPTION_FIELDS)
   │  └─ shapeRegistry.ts              (SHAPE_FIELDS, buildAnnotations)
   ├─ components/
   │  ├─ modals/{BaseModal, ConfirmModal, ConfirmSaveFileModal}.vue
   │  ├─ form/{SectionField, ButtonField, StyledSelectWrapper, IsNegativeField}.vue
   │  ├─ SectionPropertiesTable.vue
   │  ├─ Spinner.vue
   │  └─ quickActions/{QuickActionsBar, QuickActionButton, QuickActionsDivider, QuickToggleDropdown,
   │                   ViewQuickActions, HistoryQuickActions, SnapControl}.vue + canvasViewActions.ts + useSnapControl.ts
   ├─ composables/{useHotKey, useModalKeyboard, useLocalHistory, useListItemDrag, useRenameListItem, useStoreGeometryWatcher*}.ts
   ├─ services/
   │  ├─ hotkeys/{NativeHotKeysService, OperatingSystemService, hotKeysLabels}.ts
   │  └─ eventBus.ts
   ├─ math/{anglesMath, round, snap}.ts
   ├─ utils/{plainData, debounce}.ts
   ├─ io/{downloadFiles, uploadFile, fileName, mimeTypes}.ts   (was fileLoader)
   ├─ types/{geometry, sectionProperties, femMeshOptions}.ts
   └─ assets/icons/{undo, redo}.svg
```
\* `useStoreGeometryWatcher` reads `store/`, which `shared/` must not import. Put it in `store/composables/`, or pass the getter in.

Not under `src/`: move `testFiles/` to `/fixtures/` (or `/tests/fixtures/`). Delete `images/logo.png` and `svg/overlays-focus.svg` if they are confirmed unused.

### 7.3 Decisions to make
- **RightPanel**: delete it, or revive it as `features/right-panel/` (name/position editor). Right now it is dead code.
- **`shared/canvas` vs `features/canvas-engine`**: it is placed in `shared/` because four features use it. If it grows, `src/canvas/` could become its own layer at the same level as `solvers/`.
- **`shared/shapes`**: keeps per-shape metadata (fields, annotations, types) together. The polygon and property strategies stay in `solvers/`, with one file per shape on each side.
- **Naming**: kebab-case feature folders (`top-bar`, `left-panel`) or camelCase (`topBar`). Pick one; the tree above uses kebab-case.

---

## 8. Migration plan (each step keeps the app building)

**Phase 0: tooling and cleanup**
1. Add the `@/` → `src/` alias in `tsconfig.app.json` and `vite.config.ts`. Use one import style (no `.ts` suffixes).
2. Delete the dead code: `triangulateOldNoMemosAndOptimizations.ts`, unused svg/png, `.DS_Store`. Move `testFiles/` out of `src/`. Decide on RightPanel.
3. Add Vitest and snapshot-test the solvers on a few reference geometries before moving them. This is the safety net for the restructure.

**Phase 1: fix the layering problems in place (no moves yet)**
1. Solvers: replace toast and useDebounce with returned errors (`errors.ts`) and let callers toast. Have the Composite solver take `parts[]` instead of `Store`. Move `Triangle` to `fem/mesh.types.ts`. Add `solvers/index.ts`, and export `isPointInPolygon`, `rotatePoint` and `getHollowRectangleRingLengths` from it.
2. Move `ArrowAxis` into `DimensionSource.ts` to break the interface ↔ component cycle.
3. Merge `hotKeysLabels` into the hotkeys module.
4. Move `GenericBeamView`'s direct store write behind a callback or store action.
5. Optional: decouple `history` from `sectionModal` with an `isBlocked` probe registered by the modal.

**Phase 2: extract `shared/`** (biggest win; removes about 70% of cross-feature imports)
1. `shared/canvas/` (engine + canvasStyle/canvasInteraction).
2. `shared/shapes/` (types, fields, staticAnnotations, shapeRegistry).
3. `shared/components` (BaseModal, ConfirmModal, ConfirmSaveFileModal, form fields, SectionPropertiesTable, quickActions kit, Spinner).
4. `shared/{math, utils, io, services, composables, types}`.

**Phase 3: move the features one at a time**, in this order: info → left-panel → report → custom-shape → section-editor → view → top-bar → app.

**Phase 4: enforce the rules**
1. Add the eslint boundaries rule (§7.1) to CI.
2. Split `constants/canvasFit.ts` and `canvasInteraction.ts` per §5, then delete the empty `constants/`, `interfaces/`, `components/` and `pages/` folders.

**Verification after each step:** `npm run build` (type-check + bundle), the solver tests, and a manual smoke test: add every shape type, edit one from the left panel, custom shape with CSV import and FEM, undo/redo/copy/paste, open an info panel, File → Show Results (report renders and prints), export and import a project.
