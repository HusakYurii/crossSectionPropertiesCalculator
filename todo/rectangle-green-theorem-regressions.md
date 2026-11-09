# Problems after moving the rectangle to Green's theorem

`RectanglePropertiesStrategy` used to have a closed-form branch for rotations in multiples of 180 degrees. It now always calls `calculateCrossSectionProperties` from `greenTheoremCalculator.ts`. The results are correct for every real rectangle, but the change exposed the problems below. Nothing is fixed yet.

Solver results were measured by running the real solver code in Node. Canvas effects come from reading the code and the canvas spec, not from a browser run.

## 1. NaN for zero width or height (medium, new)
With `w = 0` or `h = 0` at rotation 0 or 180, `A` is 0, so `Qy0 / A` in `greenTheoremCalculator.ts` gives NaN. This also happens when a field is emptied (`v-model.number` gives `''`, and `'' / 2` is 0) and when typing the leading "0" of "0.5". Other rotations already did this, and so does `RoundedRectangle`.

| `w = 0`, `h = 100` | Result |
|---|---|
| Now | `A` and the section moduli are 0; centroid, inertias, `theta_p_deg` and radii are NaN (13 of 18 rows) |
| Old closed form | Centroid and inertias are 0, `rx` is 28.87; only `Wy_rt` and `Wy_lf` are NaN (2 rows) |

What the user sees:
- **Form table:** "NaN" in 13 rows, flickering while typing (`SectionPropertiesTable.vue`).
- **Preview:** the outline disappears, because `panX` and `panY` are NaN (`ShapeCanvasPreview.vue`).
- **Saving:** the rectangle form has no `isValid`, so the shape can be saved, and it is then invisible on the main canvas.
- **Fit to screen (the worst effect):** the NaN bounding box spreads to the union for all shapes (`drawUtils.ts`), so `View.vue` and `CanvasTransformService.ts` store NaN zoom and pan. Recovering needs both Reset zoom and Center, and pressing Fit again breaks the view until the shape is fixed.

The composite solver also returns NaN, but it isn't visible today: `FilesMenu.vue` only reads `A > 0`, and the report's JSON turns NaN into null. That is correct only by accident.

### Proposed fix
In `CrossSectionPropertiesSolver.calculate`, return the empty properties when there is no area:

```ts
const result = strategy.execute(geometry, polygon);
clear();
if (!(result.A > 0)) return { ...EMPTY_CROSS_SECTION_PROPERTIES };
return result;
```

This matches `CustomShapePropertiesStrategy`, and also fixes `RoundedRectangle`, the other polygon shapes and the report crash in item 4. Don't throw inside `calculateCrossSectionProperties`: the FEM solver passes it degenerate triangles and filters them by area.

## 2. Rounded values reach the composite solver (low to medium, new)
`greenTheoremCalculator.ts` rounds to 2 decimals, and `CompositeCrossSectionPropertiesSolver.ts` adds up those rounded values. Rotated rectangles and other polygon shapes already behaved this way.

- **False error:** a single 20 x 0.1 strip stores `Ix` (0.00167) as 0, so the composite hits `Ix <= 0`. Show Results then says "Negative shapes must lie inside the positive shapes." with no negative shape present. A 1 x 0.1 rectangle fails the same way.
- **Accuracy:** a 0.5 x 0.5 rectangle gives composite `rx` 0.20 instead of 0.14, because `Ix` rounds from 0.0052 to 0.01.
- **Very small parts:** a 0.05 x 0.05 rectangle gets `A = 0` and the misleading "negative shapes take away all the area" toast. That size is unrealistic.

### Proposed fix
Store more decimals and round only for display. `HollowRectanglePropertiesStrategy` already computes at higher precision (8), but display rounding would need adding. This affects all polygon shapes, so it needs a decision.

The minimum fix is to show the negative-shape error only when a negative shape exists.

## 3. Composite doc example is off by 0.01 (low, new)
The T-section in `composite_cross_section_properties_math.md` now computes `Ix = 5333333.34` and `Iy = 1733333.34` (`Ip = 7066666.68`), but the doc says .33.

### Proposed fix
Change the `Ix` and `Iy` inputs in the example to .34. The `W` values don't change.

## 4. Report crashes on a saved zero-dimension shape (medium, older bug)
The snapshot's `JSON.stringify` turns NaN into null, the importer doesn't validate, and `round(null)` in `ReportPage.vue` throws on `.toFixed`. The old closed form failed the same way through `Wy_rt` or `Wx_top`.

### Proposed fix
The guard in item 1 removes this.

## 5. "?" button on circle forms opens the wrong page (low, older bug)
`CreateOrUpdateSectionDataModalWindow.vue` sends every non-FEM shape to `whatIsGreensTheoremSolver`, but circles don't use Green's theorem.

### Proposed fix
Send `TUBE` and `HOLLOW_TUBE` to `whatIsClassicSolver`.

## Doc wording
In `standard_cross_section_properties_math.md`, "Both axes are axes of symmetry for both shapes" reads awkwardly. Suggested replacement:

> All the moments below are about the centroidal axes. A circle is symmetric about both the X and Y axes, so the product of inertia is always zero:

## Checked and fine
- `theta_p_deg` and the centroid match the closed form exactly across 567 cases (dimensions 0.5 to 25000, rotations from -180 to 1800). Wide gives 90, tall gives 0, square gives 0.
- Code that uses the centroid or principal axes (`GenericBeamView`, `PropertyOverlays.ts`, `principalAxes.ts`) sees the same values as before.
- `Ixy` can show small non-zero values at extreme sizes (at most 1.59 in the grid, where it used to be 0). `theta_p_deg` stays correct, so this is cosmetic.
- Negative `w` or `h` now gives positive `A` and inertias. The old code gave negative values.
- Section references in the docs and the pages in `src/pages/info` are accurate.
