# Cross-Section Properties of a Built-Up Section

This is the algorithm the app uses to find the properties of the whole section when several shapes are placed together on the canvas. Each shape brings its own properties (found with the algorithm in "Cross-Section Properties via Green's Theorem", in closed form, or, for a custom shape, with the algorithm in "Cross-Section Properties via a Triangle Mesh (FEM)"), and the algorithm combines them into the properties of one built-up section.

The idea in short:

1.  **Add up.** The area and the centroid of the whole section come from the areas and centroids of the shapes. A negative shape counts with a minus sign.
2.  **Move each shape's moments to the centroid of the whole.** The parallel axis theorem moves the inertia of every shape from its own centroid to the centroid of the whole section, and the moved values are added (a negative shape is subtracted).
3.  **Principal axes, radii and moduli** are then found from the totals, the same way as for a single shape.

No mesh and no numerical integration are used. Given the properties of the shapes, the combination is exact, so the only errors are those of the layout assumptions (section 2) and rounding (section 12).

---

## 1. Input: the shapes on the canvas

For every shape $i$ the algorithm needs:

*   its area $A_i$,
*   its moments of inertia $I_{x,i}$, $I_{y,i}$ and its product of inertia $I_{xy,i}$, all about **its own centroid**, with axes parallel to the global X and Y,
*   the position $(x_i, y_i)$ of its centroid in the global coordinates,
*   its outline, which is used only to find the outermost fibers (section 11).

A shape that has no properties, no position or no outline is skipped.

Each shape also has a sign $s_i$:

$$s_i = \begin{cases} +1 & \text{positive shape} \\ -1 & \text{negative shape} \end{cases}$$

---

## 2. Assumptions

The algorithm trusts the layout. It does not intersect or clip the shapes, so:

*   **Overlapping positive shapes count twice.** If two positive shapes overlap, the overlap is counted in the area and in the inertia of both.
*   **A negative shape must lie inside the positive shapes.** A negative shape that sticks out of them subtracts area and inertia that are not there.
*   **A negative shape does not change the outermost fibers** (section 11). If a negative shape removes a whole outer strip of a positive shape, the distance to the outer fiber is too large and the section modulus is too small.
*   **Rotation is already included.** A rotated shape arrives with the properties of the rotated shape, and its outline is the rotated outline. The algorithm does not rotate anything.

<small>**Note: units.** The algorithm does not care about units. All values are in the units of the input (for example mm, mm², mm⁴).</small>

---

## 3. Area and first moments

The algorithm goes through the shapes once and adds up the signed area and the signed first moments of area:

$$A = \sum_i s_i\,A_i$$

$$S_x = \sum_i s_i\,A_i\,y_i, \qquad S_y = \sum_i s_i\,A_i\,x_i$$

$S_x$ is the first moment of area about the X axis (it uses the $y$ positions), and $S_y$ is the first moment about the Y axis (it uses the $x$ positions).

**Error case.** If there are no shapes, or if $A \le 0$ (the negative shapes take away all the area), the algorithm shows an error message and returns $0$ for every result.

---

## 4. Centroid

$$\bar{x} = \frac{S_y}{A}, \qquad \bar{y} = \frac{S_x}{A}$$

This is the centroid of the whole section, in the global coordinates. All moments below are about the axes through it.

---

## 5. Distances from each shape to the centroid

For every shape, the distance between its own centroid and the centroid of the whole section:

$$d_{x,i} = x_i - \bar{x}, \qquad d_{y,i} = y_i - \bar{y}$$

These distances are signed. They are positive when the shape lies to the right of, or above, the centroid of the whole.

---

## 6. Parallel axis theorem

The parallel axis theorem moves the moments of every shape from its own centroid to the centroid of the whole section, and the signed sums give the totals:

$$I_x = \sum_i s_i \left( I_{x,i} + A_i\,d_{y,i}^2 \right)$$

$$I_y = \sum_i s_i \left( I_{y,i} + A_i\,d_{x,i}^2 \right)$$

$$I_{xy} = \sum_i s_i \left( I_{xy,i} + A_i\,d_{x,i}\,d_{y,i} \right)$$

$I_x$ uses the distance $d_y$ (the distance between the two parallel axes that are parallel to X), and $I_y$ uses $d_x$.

**A negative shape subtracts everything it contributes.** For $s_i = -1$ both terms are subtracted: the inertia of the negative shape about its own centroid and the parallel axis term $A_i\,d^2$. The second term is not forgotten: a negative shape far from the centroid takes away much more than its own inertia.

<small>**Note: the plus sign.** In section 7 of "Cross-Section Properties via Green's Theorem" the parallel axis theorem is applied backwards, from the origin to the centroid, and has a minus sign. Here it goes the book's way, from each shape's centroid out to the centroid of the whole, so $+\,A_i d^2$ is always right. The sign of $A_i\,d_{x,i}\,d_{y,i}$ in $I_{xy}$ is the sign of the product of the two signed distances, so it can be negative.</small>

---

## 7. Principal axes

The principal axes are the two perpendicular centroidal axes where the product of inertia is zero. The angle of the axis with the largest moment of inertia ($U$ axis), counterclockwise from the X axis, is

$$\theta_p = \frac{1}{2} \arctan\!\left(\frac{-2\,I_{xy}}{I_x - I_y}\right)$$

The angle $2\theta_p$ is taken in the quadrant of the point $(I_x - I_y,\; -2\,I_{xy})$, with $-180° < 2\theta_p \le 180°$. The quadrant is what makes $\theta_p$ the angle of the $U$ axis and not of the $V$ axis. For $I_x = I_y$ the fraction is undefined and $2\theta_p = \pm 90°$, with the sign of $-2\,I_{xy}$.

This is the same formula, with the same handling of symmetric sections, as in section 8 of "Cross-Section Properties via Green's Theorem". When $I_{xy}$ is only rounding noise,

$$|I_{xy}| \le 10^{-9} \cdot \max(|I_x|, |I_y|),$$

the axes are taken to be X and Y: $\theta_p = 0$ when X is the strong axis (or $I_x = I_y$ within the same tolerance), and $\theta_p = 90°$ otherwise. This keeps a symmetric section from getting a random $0°$, $90°$ or $45°$.

The principal moments of inertia are

$$I_u = \frac{I_x + I_y}{2} + \sqrt{\left(\frac{I_x - I_y}{2}\right)^2 + I_{xy}^2}$$

$$I_v = \frac{I_x + I_y}{2} - \sqrt{\left(\frac{I_x - I_y}{2}\right)^2 + I_{xy}^2}$$

---

## 8. Validity check

Negative shapes can leave a positive area $A$ and still take away more inertia than the positive shapes have (for example a negative shape that lies outside the positive shapes). The algorithm checks the totals before going on:

$$I_x \le 0 \quad\text{or}\quad I_y \le 0 \quad\text{or}\quad I_v < 0$$

If any of these is true, the algorithm shows an error message and returns $0$ for every result. Without this check the radii of gyration would be the square root of a negative number.

---

## 9. Polar moment of inertia

$$I_p = I_x + I_y$$

This is the polar moment about the centroid. It is **not** the torsion constant $J$ of the section; the two are the same only for a solid or hollow circle.

---

## 10. Radii of gyration

$$r_x = \sqrt{\frac{I_x}{A}}, \qquad r_y = \sqrt{\frac{I_y}{A}}, \qquad r_u = \sqrt{\frac{I_u}{A}}, \qquad r_v = \sqrt{\frac{I_v}{A}}$$

---

## 11. Extreme fibers and section moduli

The elastic section moduli need the distance from the centroid to the outermost fibers. The algorithm finds the extreme coordinates $x_{\min}$, $x_{\max}$, $y_{\min}$, $y_{\max}$ over the **positive shapes only** ($s_i = +1$). Negative shapes are skipped. Shapes with no area are skipped as well.

*   **Polygon shapes.** The outline vertices are moved from the shape's own coordinates to the global position. If $(p_x, p_y)$ is a vertex and $(\bar{p}_x, \bar{p}_y)$ is the shape's own centroid in the coordinates of the outline, the vertex in the global coordinates is

    $$x = p_x - \bar{p}_x + x_i, \qquad y = p_y - \bar{p}_y + y_i$$

    The farthest point of a polygon in any direction is one of its vertices, so this is exact.
*   **Circles and rings** (outer diameter $D$). The outline of a circle on the screen is a polygon with a limited number of segments, and depending on the diameter and the rotation it may have no vertex exactly at the top, bottom, left or right. So the algorithm does not use it. The extremes are exactly

    $$x_i \pm \frac{D}{2}, \qquad y_i \pm \frac{D}{2}$$

The distances to the outer fibers are

$$c_{\text{top}} = y_{\max} - \bar{y}, \qquad c_{\text{bot}} = \bar{y} - y_{\min}, \qquad c_{\text{rt}} = x_{\max} - \bar{x}, \qquad c_{\text{lf}} = \bar{x} - x_{\min}$$

and the elastic section moduli about the X and Y axes are

$$W_{x,\text{top}} = \frac{I_x}{c_{\text{top}}}, \qquad W_{x,\text{bot}} = \frac{I_x}{c_{\text{bot}}}, \qquad W_{y,\text{rt}} = \frac{I_y}{c_{\text{rt}}}, \qquad W_{y,\text{lf}} = \frac{I_y}{c_{\text{lf}}}$$

If a distance $c$ is zero or negative (a degenerate layout), that modulus is returned as $0$ instead of dividing by it.

<small>**Note: negative shapes and the fibers.** A negative shape is skipped because in a correct layout it lies inside the positive shapes and cannot reach further out than they do. The exception is a negative shape that cuts away a whole outer strip of a positive shape (see section 2): the algorithm does not see this, and the corresponding $W$ is too small. Finding the true outline would need the shapes to be clipped against each other, which this algorithm does not do.</small>

No moduli about the principal axes $U$ and $V$ are computed.

---

## 12. Rounding

The properties of the shapes are used as they are stored. Most shapes arrive already rounded to 2 decimals; only the closed-form circles are not rounded. So the result can differ in the last digits from a calculation with unrounded values.

The algorithm itself works at full floating point precision, and only the final results are rounded to 2 decimals. A value that rounds to zero is always shown as $0$, never as $-0.00$.

---

## 13. Algorithm summary

1.  Collect the shapes and their signs $s_i$ (section 1).
2.  Sum $A$, $S_x$, $S_y$. Stop with an error if $A \le 0$ (section 3).
3.  Find the centroid $(\bar{x}, \bar{y})$ (section 4).
4.  Find $d_{x,i}$, $d_{y,i}$ and sum $I_x$, $I_y$, $I_{xy}$ with the parallel axis theorem (sections 5 and 6).
5.  Find $\theta_p$, $I_u$, $I_v$ (section 7).
6.  Stop with an error if $I_x \le 0$, $I_y \le 0$ or $I_v < 0$ (section 8).
7.  Find $I_p$ and the radii of gyration (sections 9 and 10).
8.  Find the extreme fibers of the positive shapes and the section moduli (section 11).
9.  Round the results (section 12).

### Worked example: T-section from two rectangles

A flange $100 \times 20$ with its centroid at $(0,\ 110)$ and a web $20 \times 100$ with its centroid at $(0,\ 50)$. Both are positive shapes, so $s_i = +1$.

| Shape | $A_i$ | $I_{x,i}$ | $I_{y,i}$ | $y_i$ |
| --- | --- | --- | --- | --- |
| Flange | 2000 | 66666.67 | 1666666.67 | 110 |
| Web | 2000 | 1666666.67 | 66666.67 | 50 |

*   $A = 2000 + 2000 = 4000$, $S_x = 2000 \cdot 110 + 2000 \cdot 50 = 320000$, so $\bar{y} = 80$. Both shapes are centered on $x = 0$, so $\bar{x} = 0$.
*   $d_y = +30$ for the flange and $d_y = -30$ for the web, $d_x = 0$ for both.
*   $I_x = (66666.67 + 2000 \cdot 30^2) + (1666666.67 + 2000 \cdot 30^2) = 1866666.67 + 3466666.67 = 5333333.33$
*   $I_y = 1666666.67 + 66666.67 = 1733333.33$ and $I_{xy} = 0$, so $\theta_p = 0$, $I_u = I_x$ and $I_v = I_y$.
*   The top of the flange is at $y = 120$ and the bottom of the web at $y = 0$, so $c_{\text{top}} = 40$ and $c_{\text{bot}} = 80$. Then $W_{x,\text{top}} = 5333333.33 / 40 = 133333.33$ and $W_{x,\text{bot}} = 5333333.33 / 80 = 66666.67$.
*   The widest part is the flange: $c_{\text{rt}} = c_{\text{lf}} = 50$, so $W_{y,\text{rt}} = W_{y,\text{lf}} = 1733333.33 / 50 = 34666.67$.

### Summary of results

| Symbol | Meaning |
| --- | --- |
| $A$ | area |
| $\bar{x}$, $\bar{y}$ | centroid |
| $I_x$, $I_y$ | moments of inertia about the centroidal X and Y axes |
| $I_{xy}$ | product of inertia about the centroidal axes |
| $\theta_p$ | angle of the $U$ axis from X, counterclockwise, in degrees |
| $I_u$, $I_v$ | largest and smallest principal moments of inertia |
| $I_p$ | polar moment of inertia about the centroid |
| $r_x$, $r_y$, $r_u$, $r_v$ | radii of gyration |
| $W_{x,\text{top}}$, $W_{x,\text{bot}}$ | elastic section moduli for bending about X |
| $W_{y,\text{rt}}$, $W_{y,\text{lf}}$ | elastic section moduli for bending about Y |
