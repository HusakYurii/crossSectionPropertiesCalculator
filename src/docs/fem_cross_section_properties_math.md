# Cross-Section Properties via a Triangle Mesh (FEM)

This is the algorithm the app uses for the custom shape when the FEM solver is chosen. It cuts the outline of the shape into triangles (a mesh), finds the properties of every triangle exactly, and adds them up.

The idea in short:

1.  **Mesh.** The outline is cut into triangles that fill the whole shape, with no gaps and no overlaps.
2.  **Each triangle on its own.** Its area, centroid and moments of inertia about its own centroid are found with the algorithm from "Cross-Section Properties via Green's Theorem". For a triangle these formulas are exact.
3.  **Add up.** The area and the centroid of the whole shape come from the areas and centroids of the triangles. Each triangle's moments are then moved to the centroid of the whole shape with the parallel axis theorem and added.

**The result does not depend on how fine the mesh is.** Every triangle is solved exactly, and the triangles together cover exactly the polygon, so any mesh of the same polygon gives the same numbers. The only differences are rounding and the tiny slivers that are dropped (section 4). A finer mesh does not make the properties more accurate.

So why is a mesh used at all? The mesh is drawn on the screen, and it is the base for properties that really do need a mesh, such as the torsion constant and shear. These are still to come. For now the FEM solver gives the same properties as the polygon solver (area, centroid, inertia, principal axes, moduli).

---

## 1. Input and mesh settings

The input is a closed ring of vertices $(x_i, y_i)$: the outline of the shape, with the first point repeated at the end. The shape is a single simple polygon, without holes.

The mesh is controlled by six settings:

| Setting | Default | Allowed range | Meaning |
| --- | --- | --- | --- |
| Improve passes | 10 | 0 to 100, whole number | maximum number of edge flipping passes (section 2.4) |
| Subdivide levels | 0 | 0 to 3, whole number | how many times every triangle is split into 4 (section 2.6) |
| Min segment length | 2 | 0.01 and up | the boundary is never resampled finer than this (section 2.1) |
| Min angle | 28° | 0° to 35° | refinement works on triangles with a smaller angle (section 2.5) |
| Max Steiner points | 500 | 0 to 5000, whole number | refinement stops after adding this many points |
| Max iterations | 1000 | 1 to 20000, whole number | refinement stops after this many steps |

A setting that is left empty, or is not a finite number, gets its default. A whole-number setting is first rounded to the nearest integer. Then every value is moved into the allowed range, so no input can make the algorithm run for ever or build millions of triangles.

---

## 2. Building the mesh

### 2.1 Resampling the boundary

First the boundary points are made evenly spaced. The length of the shortest edge of the outline is

$$\ell_{\min} = \min_i \sqrt{(x_{i+1}-x_i)^2 + (y_{i+1}-y_i)^2}$$

and the spacing used is

$$s = \max(\ell_{\min},\ s_{\min})$$

where $s_{\min}$ is the min segment length setting.

An edge of length $L \le s$ is left as it is. A longer edge gets $m - 1$ new points, where $m = \lfloor L/s \rfloor$, evenly spaced along it (so an edge with $L < 2s$ gets none):

$$P_k = A + \frac{k}{m}\,(B - A), \qquad k = 1, \dots, m-1$$

where $A$ and $B$ are the ends of the edge. This way every edge ends up shorter than $2s$, and a long flat side does not end up as one long thin triangle that can't be improved later.

### 2.2 Duplicate points and fixed edges

A point that is within $10^{-6}$ of the previous kept point (distance $\le 10^{-6}$) is removed, and so is a last point that is within $10^{-6}$ of the first one (this removes the repeated closing point). Every edge between neighbouring points of the remaining ring is a **boundary edge**. A boundary edge is fixed: the algorithm never flips it and never lets a new triangle cross it.

### 2.3 Cutting the polygon into triangles (ear clipping)

The first triangles are made by repeatedly cutting a corner off the polygon. A vertex $B$ with neighbours $A$ and $C$ is an **ear** when:

*   it is **convex**: the cross product

    $$(B-A) \times (C-B) = (B_x - A_x)(C_y - B_y) - (B_y - A_y)(C_x - B_x)$$

    has the same sign as the orientation of the polygon (the sign of its signed area), and is not zero, and
*   **no other remaining vertex** lies inside triangle $ABC$ (a vertex on its edge counts as inside).

If there are several ears, the algorithm cuts the one whose triangle has the **largest smallest angle**, so the best looking triangle is taken first. The triangle $ABC$ is saved and $B$ is removed from the polygon. This repeats until 3 vertices are left, and they form the last triangle. If no ear can be found (a damaged outline), the cutting stops there, and the part that is left has no triangles.

### 2.4 Flipping edges

Ear clipping can leave long thin triangles fanning out of one vertex. To improve them, the algorithm looks at every pair of triangles that share an edge. Let the shared edge be $PQ$, and let $R$ and $S$ be the two other vertices. The edge is flipped, so the two triangles $PQR$ and $PQS$ become $PRS$ and $RQS$, when both conditions hold:

*   **$S$ lies inside the circumscribed circle of $PQR$.** With the vertices $a, b, c$ of $PQR$ taken counterclockwise and $d = S$, shift everything so that $d$ is the origin: $a' = a - d$, $b' = b - d$, $c' = c - d$. The test is

    $$\begin{vmatrix} a'_x & a'_y & a'^2_x + a'^2_y \\ b'_x & b'_y & b'^2_x + b'^2_y \\ c'_x & c'_y & c'^2_x + c'^2_y \end{vmatrix} > 0$$

*   **The four points $P, R, Q, S$ form a convex quadrilateral**, so the new edge $RS$ lies inside it.

The algorithm makes up to **improve passes** passes over all pairs, and stops earlier if a whole pass flips nothing. Flipping adds no points and moves none.

### 2.5 Adding points where triangles are too thin (refinement)

Flipping can only use the points that are already there. When a dense group of points (for example a rounded corner) sits next to a sparse side, thin triangles remain. The algorithm adds new points, called Steiner points, until every triangle has all its angles at least equal to the min angle $\theta_{\min}$.

Before it starts, the algorithm measures the shortest boundary edge $\ell_{\text{in}}$ at that moment (after resampling) and sets a length floor

$$\ell_{\text{floor}} = 0.05\,\ell_{\text{in}}$$

Then it repeats the following steps.

1.  **Pick the worst triangle:** the one with the smallest angle, among the triangles that are not skipped. Triangles with an area below $10^{-4}$ are skipped for good: they are flat and have nothing to draw, and splitting a straight line only gives more flat triangles. If the smallest angle of the worst triangle is $\ge \theta_{\min}$ (or nothing is left), the mesh is good and the algorithm stops.

2.  **Circumcenter.** The point $p$ that is the same distance from the three vertices of the triangle:

    $$D = 2\big(a_x(b_y - c_y) + b_x(c_y - a_y) + c_x(a_y - b_y)\big)$$

    $$p_x = \frac{|a|^2 (b_y - c_y) + |b|^2 (c_y - a_y) + |c|^2 (a_y - b_y)}{D}, \qquad p_y = \frac{|a|^2 (c_x - b_x) + |b|^2 (a_x - c_x) + |c|^2 (b_x - a_x)}{D}$$

    where $|a|^2 = a_x^2 + a_y^2$ and so on. If $|D| < 10^{-12}$ the three points are on a line and there is no circumcenter.

3.  **Outside the shape.** If there is no circumcenter, or $p$ is outside the polygon, $p$ can't be used. Instead the algorithm splits one of the triangle's boundary edges at its midpoint. If the triangle has no boundary edge, or that edge is shorter than $\ell_{\text{floor}}$, the triangle is skipped.

4.  **Too close to a boundary edge.** For a boundary edge with ends $a$ and $b$, the point $p$ is too close when

    $$(a_x - p_x)(b_x - p_x) + (a_y - p_y)(b_y - p_y) \le 0$$

    which means that $p$ lies inside the circle that has the edge as its diameter. All boundary edges are checked, not only those of this triangle. In this case $p$ is not added. Instead that edge is split at its midpoint. If the edge is shorter than $\ell_{\text{floor}}$, the triangle is skipped.

5.  **Too close to a point.** If $p$ is closer than $\ell_{\text{floor}}$ to any vertex of the mesh, adding it would create a needle-thin or coincident triangle, so the triangle is skipped.

6.  **Adding the point.** Otherwise $p$ is added to the mesh. The algorithm finds the triangle that contains $p$ (if there is none, the triangle being fixed is skipped), and then collects the *cavity*: that triangle, plus its neighbours whose circumscribed circle contains $p$ (the same test as in section 2.4), and so on from neighbour to neighbour. The collection never crosses a boundary edge. The triangles of the cavity are removed, and the hole is filled with a fan: one triangle from $p$ to every edge on the rim of the cavity. A split of a boundary edge is done the same way, with the midpoint as $p$ and the triangle on that edge as the start of the cavity, and both halves of the edge stay fixed boundary edges.

Every point added (a circumcenter or a midpoint) counts as one Steiner point. The algorithm stops when the number of Steiner points reaches **max Steiner points**, or the number of steps reaches **max iterations**. The number of points is checked after a point is added, so a limit of 0 still lets one point in. A step that only skips a triangle also counts as a step. The result is then "good enough", and some triangles may still be thinner than $\theta_{\min}$.

<small>**Note: skipped triangles.** A sharp corner of the outline itself has a small angle, and no added points can change that. Without the floor $\ell_{\text{floor}}$, the algorithm would split towards such a corner for ever. Skipped triangles are kept in the mesh: they still cover their part of the shape exactly, so the properties are not affected.</small>

### 2.6 Subdividing

Last, each triangle $ABC$ can be split into 4 by joining the midpoints of its sides, $M_{AB}$, $M_{BC}$, $M_{CA}$:

$$A\,M_{AB}\,M_{CA}, \qquad M_{AB}\,B\,M_{BC}, \qquad M_{CA}\,M_{BC}\,C, \qquad M_{AB}\,M_{BC}\,M_{CA}$$

This is done **subdivide levels** times. Each level halves the edge lengths and multiplies the number of triangles by 4. The angles stay the same.

---

## 3. Each triangle on its own

Every triangle is solved with the algorithm from "Cross-Section Properties via Green's Theorem", as a polygon of 3 vertices. The triangle is passed as a closed ring, and the repeated closing point is dropped there. The results are rounded to **10 decimals**, much more than is shown, so rounding does not add up over thousands of triangles.

For triangle $i$ the algorithm gets:

*   its area $A_i$,
*   its centroid $(\bar{x}_i, \bar{y}_i)$, which is the average of its three vertices,
*   its moments of inertia $I_{x,i}$, $I_{y,i}$ and its product of inertia $I_{xy,i}$, about axes through **its own centroid**, parallel to X and Y.

These are exact, because the formulas in that document are exact for any polygon, and a triangle is a polygon.

---

## 4. Dropping slivers

A triangle with

$$A_i \le 10^{-9}$$

is a sliver with nothing to add, and it is left out of all the sums below. The rest of the triangles are numbered $i = 1, \dots, n$.

---

## 5. Area and centroid

$$A = \sum_{i=1}^{n} A_i$$

$$S_x = \sum_{i=1}^{n} A_i\,\bar{y}_i, \qquad S_y = \sum_{i=1}^{n} A_i\,\bar{x}_i$$

$$\bar{x} = \frac{S_y}{A}, \qquad \bar{y} = \frac{S_x}{A}$$

The centroid of the whole shape is the mean of the centroids of the triangles, weighted by their areas.

If $A \le 0$ (for example, no triangle could be made from a damaged outline), there is no section, and **all properties are returned as 0**.

---

## 6. Moving each triangle to the centroid of the whole shape

The distances between the centroid of triangle $i$ and the centroid of the whole shape:

$$d_{x,i} = \bar{x}_i - \bar{x}, \qquad d_{y,i} = \bar{y}_i - \bar{y}$$

The parallel axis theorem moves the moments of the triangle to axes through $(\bar{x}, \bar{y})$, and the moments of the whole shape are the sums:

$$I_x = \sum_{i=1}^{n} \left( I_{x,i} + A_i\,d_{y,i}^2 \right)$$

$$I_y = \sum_{i=1}^{n} \left( I_{y,i} + A_i\,d_{x,i}^2 \right)$$

$$I_{xy} = \sum_{i=1}^{n} \left( I_{xy,i} + A_i\,d_{x,i}\,d_{y,i} \right)$$

<small>**Note: plus here, minus in the Green's theorem document.** Here the theorem is used the way books write it, $I = I_c + A\,d^2$: it takes a moment from the triangle's own centroid *out* to a parallel axis at distance $d$, so the sign is plus. In the Green's theorem document the sums give moments about the origin, and the algorithm has to move *in* to the centroid, so the sign there is minus.</small>

---

## 7. Principal axes

The principal axes are the two perpendicular centroidal axes where $I_{xy}$ is zero. The angle of the $U$ axis (the axis of the largest moment), counterclockwise from the X axis, is

$$\theta_p = \frac{1}{2} \arctan\!\left(\frac{-2\,I_{xy}}{I_x - I_y}\right)$$

shown in degrees, between $-90°$ and $90°$. The angle $2\theta_p$ is taken in the quadrant of the point $(I_x - I_y,\; -2\,I_{xy})$, with $-180° < 2\theta_p \le 180°$. The quadrant is what makes $\theta_p$ the angle of the $U$ axis and not of the $V$ axis. For $I_x = I_y$ the fraction is undefined and $2\theta_p = \pm 90°$, with the sign of $-2\,I_{xy}$.

**Symmetric sections.** When $I_{xy}$ is really zero, rounding can leave a tiny value with a random sign, and the formula above would then give $0°$, $+90°$, $-90°$ or $\pm 45°$ for a square. So the algorithm first checks whether $I_{xy}$ is only noise:

$$|I_{xy}| \le 10^{-9} \cdot \max(|I_x|, |I_y|)$$

If it is, the axes are X and Y, and:

*   $\theta_p = 0°$ when $I_x - I_y \ge -10^{-9} \cdot \max(|I_x|, |I_y|)$, so X is the strong axis (a square also gives $0°$),
*   $\theta_p = 90°$ otherwise.

This is the same rule as in the Green's theorem document.

**Principal moments of inertia:**

$$I_u = \frac{I_x + I_y}{2} + \sqrt{\left(\frac{I_x - I_y}{2}\right)^2 + I_{xy}^2}$$

$$I_v = \frac{I_x + I_y}{2} - \sqrt{\left(\frac{I_x - I_y}{2}\right)^2 + I_{xy}^2}$$

---

## 8. Polar moment of inertia

$$I_p = I_x + I_y$$

This is the polar moment about the centroid. It is **not** the torsion constant $J$ of the section; the two are the same only for a circle.

---

## 9. Radii of gyration

$$r_x = \sqrt{\frac{I_x}{A}}, \qquad r_y = \sqrt{\frac{I_y}{A}}, \qquad r_u = \sqrt{\frac{I_u}{A}}, \qquad r_v = \sqrt{\frac{I_v}{A}}$$

---

## 10. Elastic section moduli

The outermost fibers are taken from the **original vertices of the outline**, not from the mesh. The points added to the mesh lie on the outline, so they can't be farther out. With $x_{\min}$, $x_{\max}$, $y_{\min}$, $y_{\max}$ the smallest and largest coordinates of these vertices, the distances from the centroid are

$$c_{\text{top}} = y_{\max} - \bar{y}, \qquad c_{\text{bot}} = \bar{y} - y_{\min}, \qquad c_{\text{rt}} = x_{\max} - \bar{x}, \qquad c_{\text{lf}} = \bar{x} - x_{\min}$$

and the moduli are

$$W_{x,\text{top}} = \frac{I_x}{c_{\text{top}}}, \qquad W_{x,\text{bot}} = \frac{I_x}{c_{\text{bot}}}, \qquad W_{y,\text{rt}} = \frac{I_y}{c_{\text{rt}}}, \qquad W_{y,\text{lf}} = \frac{I_y}{c_{\text{lf}}}$$

If a distance is zero or negative, that modulus is returned as $0$ instead of dividing by it.

---

## 11. Rounding

Every triangle is solved with 10 decimals (section 3). The sums are then done at full floating point precision, and only the final results are rounded, to **2 decimals**.

---

## Algorithm summary

1.  Take the closed ring of the outline and the six mesh settings (empty values get defaults, the rest is moved into the allowed ranges).
2.  Resample the boundary with spacing $s = \max(\ell_{\min}, s_{\min})$, remove duplicate points within $10^{-6}$, and mark the boundary edges as fixed.
3.  Cut the polygon into triangles by ear clipping, always taking the ear with the largest smallest angle.
4.  Flip edges that break the circumcircle test (when the quadrilateral is convex), for up to improve passes passes.
5.  Add Steiner points until every triangle has a smallest angle of at least $\theta_{\min}$, or a limit is reached.
6.  Optionally split every triangle into 4, subdivide levels times.
7.  Solve every triangle exactly (10 decimals) and drop those with $A_i \le 10^{-9}$.
8.  Add up the areas and the first moments to get $A$ and $(\bar{x}, \bar{y})$. If $A \le 0$, return zeros.
9.  Move each triangle's moments to the centroid with the parallel axis theorem and add them to get $I_x$, $I_y$, $I_{xy}$.
10. Find the principal axes, the polar moment, the radii of gyration and the section moduli (the extremes come from the original vertices).
11. Round the results to 2 decimals.

---

## Summary of results

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

---

## References

*   J. Ruppert, *A Delaunay Refinement Algorithm for Quality 2-Dimensional Mesh Generation*, Journal of Algorithms 18(3), 1995.
*   A. Bowyer, *Computing Dirichlet tessellations*, The Computer Journal 24(2), 1981.
*   D. F. Watson, *Computing the n-dimensional Delaunay tessellation with application to Voronoi polytopes*, The Computer Journal 24(2), 1981.
*   C. Steger, *On the Calculation of Arbitrary Moments of Polygons*, Technical Report FGBV-96-05, TU München, 1996.
