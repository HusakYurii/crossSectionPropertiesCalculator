# Canvas grid gets too dense on big sections

`Grid` (`src/components/middle/view/shapes/Grid.ts`) always draws a line every `GRID_CELL_SIZE` (10) world units, whatever the zoom. When a big section is fitted to the canvas, the lines crowd together into grey noise behind the drawing.

## Where it happens
Canvases that fit the view to the shape with no minimum zoom:
- Report drawings: `ReportSectionCanvas.vue`, `ReportShapeCanvas.vue`
- Form preview: `ShapeCanvasPreview.vue`

Not affected, because a minimum zoom keeps the lines apart:
- Main editor canvas: `View.vue` (`minZoom` 0.7). The limit also means a big section can't be zoomed out far enough to fit.
- Custom shape form: `CustomShapeForm.vue` (`MIN_ZOOM` 0.5)

## Possible fix
Make `Grid` skip lines based on zoom, for example draw only every 10th line once cells get smaller than a few pixels. For the report, another option is to hide the grid.
