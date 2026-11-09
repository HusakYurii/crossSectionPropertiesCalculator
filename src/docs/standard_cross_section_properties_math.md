# Cross-Section Properties from Standard Formulas

These are the formulas the app uses for the shapes that are **not** solved with Green's theorem or with the FEM solver. The shapes are so simple that the well-known formulas of strength of materials give the exact result directly from their dimensions, so no outline, mesh or summation is needed.

The formulas are used for two shapes:

*   **Solid circle.**
*   **Hollow circle.**

All the other shapes use another algorithm: the rectangle (at any rotation), the rounded rectangle, the I, T, L, C and Z sections and the hollow rectangles use Green's theorem, and the custom shape uses the FEM solver.

---

## 1. Input and coordinates

The input is the dimensions of the shape in mm: outer diameter $D$ for the solid circle, and outer diameter $D$ and inner diameter $d$ for the hollow circle. The circles use the radii

$$R = \frac{D}{2}, \qquad r = \frac{d}{2}$$

Each shape is centered on the origin of its own coordinates, so its centroid is known without any calculation:

$$\bar{x} = 0, \qquad \bar{y} = 0$$

All the moments below are about the centroidal axes. Both axes are axes of symmetry for both shapes, so the product of inertia is always zero:

$$I_{xy} = 0$$

---

## 2. Solid circle

A circle is the same at any angle, so its rotation is not used. Its outline on the screen is a polygon with a limited number of segments, and Green's theorem would give the properties of that polygon and not of the true circle. The formulas below are for the true circle.

**Area and moments of inertia:**

$$A = \pi R^2 = \frac{\pi D^2}{4}$$

$$I_x = I_y = \frac{\pi R^4}{4} = \frac{\pi D^4}{64}$$

$$I_p = 2\,I_x = \frac{\pi R^4}{2} = \frac{\pi D^4}{32}$$

**Radii of gyration:**

$$r_x = r_y = r_u = r_v = \sqrt{\frac{I_x}{A}} = \frac{R}{2} = \frac{D}{4}$$

**Principal axes.** Every centroidal axis is a principal axis, with the same moment of inertia, so the angle is simply taken as zero:

$$\theta_p = 0°, \qquad I_u = I_v = I_x$$

**Elastic section moduli.** The outermost fiber is at $R$ from the centroid in every direction:

$$W_{x,\text{top}} = W_{x,\text{bot}} = W_{y,\text{rt}} = W_{y,\text{lf}} = \frac{I_x}{R} = \frac{\pi R^3}{4} = \frac{\pi D^3}{32}$$

---

## 3. Hollow circle

The dimensions are checked first. If any of the conditions below is broken, the app shows an error and all the properties are $0$:

$$D > 0, \qquad d > 0, \qquad d < D$$

A section with no hole has to be a solid circle. As for the solid circle, the rotation is not used.

**Area and moments of inertia:**

$$A = \pi (R^2 - r^2) = \frac{\pi}{4}(D^2 - d^2)$$

$$I_x = I_y = \frac{\pi}{4}(R^4 - r^4) = \frac{\pi}{64}(D^4 - d^4)$$

$$I_p = 2\,I_x = \frac{\pi}{2}(R^4 - r^4) = \frac{\pi}{32}(D^4 - d^4)$$

**Radii of gyration:**

$$r_x = r_y = r_u = r_v = \sqrt{\frac{I_x}{A}} = \sqrt{\frac{R^2 + r^2}{4}} = \frac{\sqrt{D^2 + d^2}}{4}$$

The last forms follow from $R^4 - r^4 = (R^2 - r^2)(R^2 + r^2)$, which cancels the area.

**Principal axes.** As for the solid circle:

$$\theta_p = 0°, \qquad I_u = I_v = I_x$$

**Elastic section moduli.** The outermost fiber is on the outer edge, at $R$ from the centroid in every direction:

$$W_{x,\text{top}} = W_{x,\text{bot}} = W_{y,\text{rt}} = W_{y,\text{lf}} = \frac{I_x}{R} = \frac{\pi (R^4 - r^4)}{4R} = \frac{\pi (D^4 - d^4)}{32\,D}$$

---

## 4. What is not computed

These moduli are about the X and Y axes only. No moduli about the principal axes $U$ and $V$ are computed, and neither are the plastic section moduli or the torsion constant $J$.

$I_p$ is the polar moment about the centroid. For the solid and hollow circle it is also equal to the torsion constant $J$.

---

## 5. Rounding

The results of these formulas are returned at full floating point precision and are not rounded. This is different from the shapes solved with Green's theorem, which return values rounded to 2 decimals.

The composite solver uses these unrounded values as they are when several shapes are placed together on the canvas.

---

## Summary of results

| Symbol | Meaning |
| --- | --- |
| $A$ | area |
| $\bar{x}$, $\bar{y}$ | centroid, always $(0, 0)$ in the shape's own coordinates |
| $I_x$, $I_y$ | moments of inertia about the centroidal X and Y axes |
| $I_{xy}$ | product of inertia about the centroidal axes, always $0$ |
| $\theta_p$ | angle of the $U$ axis from X, counterclockwise, in degrees |
| $I_u$, $I_v$ | largest and smallest principal moments of inertia |
| $I_p$ | polar moment of inertia about the centroid |
| $r_x$, $r_y$, $r_u$, $r_v$ | radii of gyration |
| $W_{x,\text{top}}$, $W_{x,\text{bot}}$ | elastic section moduli for bending about X |
| $W_{y,\text{rt}}$, $W_{y,\text{lf}}$ | elastic section moduli for bending about Y |

---

## References

*   W. C. Young, R. G. Budynas, *Roark's Formulas for Stress and Strain*, McGraw-Hill.
*   J. M. Gere, B. J. Goodno, *Mechanics of Materials*, Cengage Learning.
