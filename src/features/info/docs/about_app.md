# About This App

A lightweight and fast cross-section properties calculator for structural mechanics engineers. It runs entirely in your browser.

## What you can do

*   **Use basic shapes:** rectangle, hollow rectangle, tube, and I, C, T, L and Z shapes.
*   **Define your own shape:** click its points on the canvas or import them from a CSV file, then fine-tune the coordinates by typing them in.
*   **Build up a section:** combine several shapes. Mark a shape as negative to cut a hole.
*   **Print the results:** open ```File``` → ```Show Results``` for a report you can print or save as a PDF.
*   **Save your work:** export a project and import it again later.

## What it calculates

Area, centroid, moments of inertia, principal axes, polar moment, radii of gyration and section moduli. Lengths are in mm and angles in degrees.

## Algorithms used

| Shape | Method |
| --- | --- |
| Tube | Standard formulas |
| Other basic shapes | Green's theorem |
| Custom shape | FEM mesh |
| Whole section | Combined from its shapes with the parallel axis theorem |

## Good to know

*   Torsion and shear properties are not calculated yet.
*   Shapes are not clipped against each other, so the layout is up to you. A negative shape must lie fully inside the positive shapes, and negative shapes must not overlap. Otherwise the results can be wrong without any warning.
*   Overlapping positive shapes are counted twice. A cut-out that removes a whole outer strip makes the section modulus on that side too small.

