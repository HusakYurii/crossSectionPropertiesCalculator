# Navigation and Shortcuts

How to move around the canvas, move shapes and draw the points of a custom shape.

In short:

1.  **Wheel zooms, right mouse button pans.** This works on the main canvas and in the custom shape editor.
2.  **Left mouse button drags** a shape on the main canvas, or a point in the custom shape editor.
3.  **Shift keeps a drag horizontal or vertical.** The snap step in the toolbar decides where things land.

---

## 1. Keyboard shortcuts

On Windows and Linux, read **Ctrl** wherever this page says **Cmd**.

| Keys | Action | Where |
| --- | --- | --- |
| Cmd+Z | Undo | main window, custom shape editor |
| Shift+Cmd+Z, or Ctrl+Y | Redo | main window, custom shape editor |
| Shift (hold while dragging) | Move along one axis only | both canvases |
| Cmd+click | Add a point to the selection, or remove it | custom shape editor: canvas and points list |
| Delete or Backspace | Delete the selected points | custom shape editor |
| Enter | Apply the typed value | dimension number, shape name in the left panel, point coordinate |
| Tab | Apply the typed value | dimension number, shape name in the left panel |
| Escape | Cancel the typing | dimension number, shape name in the left panel |
| Escape | Deselect the points (the dialog stays open) | custom shape editor |
| Enter | OK | file name dialogs (Export Project, Export CSV) |
| Escape | Clear the first point picked for an endpoint snap | main canvas, Endpoint on |
| Escape | Close without doing anything | any dialog, help panel, solver preview and object snap lists |

<small>**Note: Escape in the shape dialog.** Escape closes the shape dialog, even while you type in one of its fields, and the changes are not saved. While points are selected, the first Escape only deselects them and the next one closes the dialog. Escape closes only the dialog on top: in a help panel or in the Export CSV dialog opened from the shape dialog, the shape dialog stays open.</small>

There is no key to delete a shape. Use the trash button in the left panel.

### Undo

*   Undo takes back changes to shapes: adding, editing, deleting, moving, renaming, reordering, and moving their dimension numbers (not Cx / Cy).
*   It keeps up to 100 steps, fewer when custom shapes have large meshes.
*   View settings are not undone: zoom, pan, snap, object snap, hatching and the solver preview options. The move made by an object snap can be undone.
*   **New Project** and **Import Project** clear the undo history.
*   Undo and Redo are also in the **Edit** menu.
*   The custom shape editor has its own undo while its dialog is open. It starts empty when the dialog opens and is gone when it closes. **Save** then becomes one step in the main undo: Cmd+Z in the main window takes back the whole edit.

<small>**Note: when undo does nothing.** Undo and redo do not work in the main window while a dialog or a help panel is open, or while a drag is running; the custom shape editor has its own undo while its dialog is open. That undo also pauses during a drag, while a help panel is open, and while the Export CSV dialog is open. While you type in a text field, Cmd+Z undoes the typing in that field.</small>

---

## 2. Moving around the canvas

| Action | How |
| --- | --- |
| Zoom | Mouse wheel. The point under the cursor stays where it is. On a trackpad, a two-finger swipe or a pinch zooms. |
| Pan | Hold the right mouse button and drag. A trackpad swipe does not pan. |

Leaving the canvas while dragging drops the item where it is and stops panning.

### Toolbar of the main canvas

The bar at the top of the main canvas, from left to right:

| Button | What it does |
| --- | --- |
| Center the canvas | Moves the origin (0, 0) to the middle. The zoom stays. |
| Reset zoom | Goes back to the starting zoom. The point in the middle stays in the middle. |
| Fit to screen | Zooms and pans so all shapes and their dimension numbers fit. If they cannot fit together, only the shapes are fitted. |
| Snap to grid step (magnet) and step list | Turns snapping on or off. The list picks the step: 10, 5, 1, 0.5, 0.1 or 0.05 mm. Picking a step does not turn snapping on. |
| Hatching | Shows or hides the hatching of the shapes. |
| Solver preview options | Toggles for the whole section: section centroid, principal axes, radius of gyration. |
| Object snap options | Endpoint: shows the points of every shape; click a point of one shape, then a point of another, to move the first shape there. |

**Snapping.** It is on by default, with a 1 mm step. A dragged shape or point lands on a multiple of the step. With snapping off, a dragged shape or point is rounded to 0.01 mm. The custom shape editor has the same snap control, and both canvases share the setting. The setting is not saved with the project and goes back to on, 1 mm, on a new or imported project.

**Shift lock.** Hold Shift while dragging: the move stays horizontal or vertical, whichever way the mouse moved more. The other coordinate keeps its value.

---

## 3. Shapes on the main canvas

| Action | How |
| --- | --- |
| Select a shape | Click it. It is also selected in the left panel. |
| Deselect | Click on empty canvas. |
| Move a shape | Drag it. Hold Shift to move along one axis. |

*   A shape is moved by its centroid, which is marked with a small cross. The position snaps to the step.
*   A click selects without moving.
*   Where shapes overlap, the one on top is grabbed. The shape lower in the left panel list is drawn on top.

### Dimension numbers

Each shape shows the X and Y of its centroid as two dimension numbers.

| Action | How |
| --- | --- |
| Slide the number along its line | Drag the number along the line. Drop it within a few pixels of its automatic place and it snaps back there. |
| Move the dimension line | Drag the number across the line. |
| Type an exact coordinate | Double-click the number, type the value, press Enter or Tab. Escape cancels. A click elsewhere also applies the value. |

*   The typed value must be a plain decimal number, such as `12.5` or `-40`. A comma also works as the decimal mark (`12,5`). Any other text is ignored and the coordinate does not change.
*   A number that sits over a shape is dragged on its own. The shape stays where it is and stays selected.
*   The **Cx** and **Cy** numbers of the section centroid (from the solver preview options) can be dragged, but not edited.

---

## 4. Left panel

| Action | How |
| --- | --- |
| Select a shape | Click its row. Click it again to deselect. |
| Rename | Double-click the name. Enter, Tab or a click elsewhere applies. Escape cancels. An empty name keeps the old one. |
| Reorder | Drag a row up or down. This also changes which shape is drawn on top. |
| Edit | The pencil button opens the shape dialog. |
| Delete | The trash button. Undo brings the shape back. |
| Change the width | Drag the right edge of the panel. |

Hovering a row highlights its shape on the canvas.

---

## 5. Points of a custom shape

The points are the outline of the shape, in the order of the points list. The last point is joined back to the first one.

| Action | How |
| --- | --- |
| Add a point | Click on empty canvas while no point is selected. The point is added at the **end** of the list and is not selected, so you can keep clicking to add more. |
| Add a point in line with the last one | Hold Shift while you click. The new edge is horizontal or vertical, whichever is closer to where you clicked. |
| Select a point | Click it. |
| Add to the selection, or remove from it | Cmd+click a point. |
| Select several points | Drag a box on empty canvas. Hold Cmd to add them to the selection instead of replacing it. |
| Move points | Drag a point. If it is part of the selection, all selected points move together. Hold Shift to move along one axis. |
| Deselect | Escape, a click on empty canvas (with points selected it only deselects them and never adds a point; hold Shift or Cmd to keep the selection), or a click outside the canvas and the points list. |
| Delete the selected points | Delete or Backspace. |
| Delete one point | The ✕ button in its row. |
| Delete all points | The **Clear** button. |
| Type exact coordinates | Type in the x and y fields of a row. The value is applied on Enter or when you leave the field. |
| Change the order | The ▲ and ▼ buttons of a row. |
| Select from the list | Click a row. Cmd+click toggles it in the selection. |

*   A point can be grabbed within 10 px of it.
*   Added and dragged points snap. In a group, only the grabbed point snaps. The others keep their distance to it.
*   A typed coordinate is rounded to 0.001 mm. Clearing a field sets it to 0.
*   A point can't be inserted between two others on the canvas. Add it, then move it to its place in the list with ▲ ▼.
*   A click on one point of a selected group, without moving, selects only that point.
*   A box over empty space clears the selection when Cmd is not held. A click there deselects the points, or keeps them with Shift or Cmd held, and adds a point only when nothing is selected.
*   Delete and Backspace do nothing while a field has focus.

<small>**Note: undo here.** The dialog has its own undo (Cmd+Z, or the Undo and Redo buttons above the canvas) for points, shape sign and mesh settings. It also takes back **Clear**, Delete and ✕, and a CSV import: the points come back, but not the results, so calculate again. To throw away all changes, close the dialog with Escape or ✕: the saved shape stays as it was.</small>

To finish the shape:

1.  Have at least 3 points, with no crossing edges. The app does not check the crossing (see "CSV File For Custom Shape", section 7).
2.  Press **Calculate with FEM**. After a change to the points or the mesh settings, the mesh disappears and **Create** / **Save** stays off until you calculate again (or undo back to the calculated shape, which brings the results back). Until then the table shows the old numbers. Switching negative / positive needs no new calculation.
3.  Press **Create** or **Save**.

The points can also be imported from a CSV file, see "CSV File For Custom Shape".
