# Problems found in the custom shape CSV import

These came up while writing `custom_shape_csv_format.md`. Nothing is fixed yet. The doc describes the current behaviour, so update it along with any fix.

Parser and solver results were measured by running the real code in Node. Canvas effects and the file picker behaviour come from reading the code and the HTML spec, not from a browser run.

## 1. Overflowing numbers are imported as Infinity (medium)
`1e400,1` passes `NUMBER_PATTERN` in `csvTextParser.ts`, and `Number('1e400')` is `Infinity`. `Math.round(Infinity) || 0` stays `Infinity`, so the point is accepted. The literal text `Infinity` is refused, but this path gets around that check.

The point then reaches `fitViewToPoints` in `CustomShapeForm.vue`, where the bounding box and `panX` / `panY` stop being finite, so the view breaks right after the import.

### Proposed fix
In `parseNumber`, refuse a value that is not finite:

```ts
if (!NUMBER_PATTERN.test(normalized)) return null;
const value = Number(normalized);
return Number.isFinite(value) ? value : null;
```

The row then fails with the existing `Line N: "..." is not a pair of numbers.` message. The doc needs no change.

## 2. A comma thousands separator is read as a decimal comma (low to medium)
In semicolon and tab files a comma is always a decimal mark.

| Row | Result |
|---|---|
| `1,000;2` | `x = 1`, `y = 2`, no error |
| `1,000` in a comma file | `x = 1`, `y = 0`, no error |
| `1,000,5;2` | refused |
| `1 000;2` and `1'000;2` | refused |

The shape comes out silently the wrong size, and a user may not notice.

### Proposed fix
This needs a decision, because `1,250` can also be a real decimal. In semicolon and tab files, refuse a cell that matches `^[+-]?\d{1,3},\d{3}$` with a message that names the line and asks for the number without a separator. The cost is that values with exactly three decimals after a comma are refused too, but the import rounds to whole numbers, so such precision is lost anyway.

A comma file can't be fixed this way: `1,000` there is a valid pair of values. If the rule above is added, update the note in section 3 of the doc and the list of refused values in section 4.

## 3. "No file was attached" probably never shows (low)
`uploadFile` in `src/fileLoader/uploadFile.ts` makes a new input on every call and listens only for `change`. Closing the picker fires `cancel` instead, so `onLoaded` is not called and the `if (!file)` branch in `importCsv` in `CustomShapeForm.vue` is effectively dead code.

### Proposed fix
Doing nothing on cancel is the right behaviour, since a user who closes the picker doesn't need an error. Remove the dead branch: call `onLoaded` only when there is a file and change its parameter to `File`. `uploadJSON` shares this function, so check its callers too. Don't add a `cancel` listener that shows the toast.

## 4. A self-intersecting outline gets no warning (medium)
Neither the importer nor the FEM solver checks that the edges don't cross. The solver needs a single simple polygon, and it stops without throwing when ear clipping gets stuck (`femTriangulator/triangulate.ts`).

| Outline | Result |
|---|---|
| Bowtie `(0,0),(40,20),(40,0),(0,20)` | `A = 0`, all properties 0, 0 triangles, no error |
| Uneven bowtie | `A = 666.8`, 83 triangles, no error |

The second case is the worst: the numbers look fine but are wrong. The first one can also be saved, because `isValid` in `CustomShapeForm.vue` only looks at the point count and `isStale`, so a shape with all-zero results passes. A polygon drawn by hand has the same problem, so this is not only about CSV files.

### Proposed fix
Add an `isSimplePolygon` check (no two non-adjacent edges intersect or touch) and call it in `calculateWithFem` before solving, so it covers both imported and drawn points. On failure show a toast naming the two crossing edges and leave the results empty and stale.

The plain pair-by-pair check is O(n²), which is about 50 million pairs at the 10000 point import limit and would block the page. Use a sweep line, or a grid of edges, if files that large matter.

The doc's section 7 says no error is given, so update it after this fix.
