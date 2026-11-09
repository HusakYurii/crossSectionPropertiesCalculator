# Cross-Section Properties via Green's Theorem

This is the algorithm the app uses to find the section properties of one closed polygon directly from its vertices. No mesh and no numerical integration are used: for a polygon these formulas are exact, so the only error is floating point rounding.

The same algorithm is used in three places:

*   **Polygon shapes** (rectangle at any rotation, rounded rectangle, I, T, L, C and Z sections): the shape's outline is passed in and the result is shown as is.
*   **Hollow rectangle:** the outer and inner rings are each solved with this algorithm, and the inner ring is then subtracted from the outer one.
*   **FEM solver:** every triangle of the mesh is solved with this algorithm as a 3-vertex polygon, and the triangles are then added up (see the FEM solver doc).

---

## 1. Input: a closed ring of vertices

The input is a list of vertices $(x_i, y_i)$ in order along the outline. The shapes in the app build their outlines **clockwise** and repeat the first point at the end to close the ring.

Before any math is done, the algorithm prepares the list:

1.  **At least 3 points** are required, otherwise the polygon is rejected with an error.
2.  **The order is reversed**, so a clockwise outline becomes counterclockwise, which is the direction Green's theorem gives a positive area for. The orientation does not actually matter (see section 5); the reversal only means the app's own shapes never need the sign fix.
3.  **The closing point is removed.** If the last point is the same as the first one (within $10^{-9}$ mm in $x$ and $y$), it is dropped. If it were kept it would add an edge of zero length. A ring that is not closed is left as it is, so no real corner is cut off.

This leaves $n$ distinct vertices. Indices wrap around: after vertex $n-1$ comes vertex $0$, so the last edge goes from $(x_{n-1}, y_{n-1})$ back to $(x_0, y_0)$.

---

## 2. Green's theorem

Green's theorem turns an integral over a region $R$ into an integral around its boundary $C$, followed counterclockwise:

$$\iint_R \left( \frac{\partial M}{\partial x} - \frac{\partial L}{\partial y} \right) dA = \oint_C \left( L\,dx + M\,dy \right)$$

Every section property we need is an area integral of a simple polynomial in $x$ and $y$. Choosing $L$ and $M$ so that the left side is that polynomial turns it into a boundary integral:

| Property | Area integral | One choice of $L$, $M$ | Boundary integral |
| --- | --- | --- | --- |
| Area | $A = \iint_R dA$ | $L = -\tfrac{y}{2},\ M = \tfrac{x}{2}$ | $\tfrac{1}{2} \oint_C (x\,dy - y\,dx)$ |
| First moment about X | $Q_{x0} = \iint_R y\,dA$ | $L = -\tfrac{y^2}{2},\ M = 0$ | $-\tfrac{1}{2} \oint_C y^2\,dx$ |
| First moment about Y | $Q_{y0} = \iint_R x\,dA$ | $L = 0,\ M = \tfrac{x^2}{2}$ | $\tfrac{1}{2} \oint_C x^2\,dy$ |
| Second moment about X | $I_{x0} = \iint_R y^2\,dA$ | $L = -\tfrac{y^3}{3},\ M = 0$ | $-\tfrac{1}{3} \oint_C y^3\,dx$ |
| Second moment about Y | $I_{y0} = \iint_R x^2\,dA$ | $L = 0,\ M = \tfrac{x^3}{3}$ | $\tfrac{1}{3} \oint_C x^3\,dy$ |
| Product moment | $I_{xy0} = \iint_R xy\,dA$ | $L = 0,\ M = \tfrac{x^2 y}{2}$ | $\tfrac{1}{2} \oint_C x^2 y\,dy$ |

The subscript $0$ means the moment is taken about the global origin $(0, 0)$, not about the centroid. The move to the centroid is done later (section 7).

---

## 3. From boundary integrals to sums over edges

The boundary of a polygon is made of straight edges, so each boundary integral is the sum of one integral per edge. On a straight edge $x$ and $y$ are linear in the edge parameter, so each of these integrals has an exact closed form in the two end points of the edge.

All of them share the same factor, the **cross product** of the edge's two end points:

$$a_i = x_i\,y_{i+1} - x_{i+1}\,y_i$$

$\tfrac{1}{2} a_i$ is the signed area of the triangle formed by the origin and the edge $i \to i+1$. This gives an easy way to read the formulas below: the polygon is cut into $n$ triangles that all share the origin as a corner, and each formula adds up the exact moments of those triangles. A triangle is positive when its edge runs counterclockwise around the origin and negative otherwise, so the parts outside the polygon cancel out.

---

## 4. The sums

The algorithm goes once around the polygon and adds up, for every edge $i \to i+1$:

$$A = \frac{1}{2} \sum_{i=0}^{n-1} a_i$$

$$Q_{x0} = \frac{1}{6} \sum_{i=0}^{n-1} a_i \,(y_i + y_{i+1})$$

$$Q_{y0} = \frac{1}{6} \sum_{i=0}^{n-1} a_i \,(x_i + x_{i+1})$$

$$I_{x0} = \frac{1}{12} \sum_{i=0}^{n-1} a_i \,(y_i^2 + y_i\,y_{i+1} + y_{i+1}^2)$$

$$I_{y0} = \frac{1}{12} \sum_{i=0}^{n-1} a_i \,(x_i^2 + x_i\,x_{i+1} + x_{i+1}^2)$$

$$I_{xy0} = \frac{1}{24} \sum_{i=0}^{n-1} a_i \,(x_i\,y_{i+1} + 2\,x_i\,y_i + 2\,x_{i+1}\,y_{i+1} + x_{i+1}\,y_i)$$

While going around, the algorithm only adds up the sums; the factors $\tfrac{1}{2}$, $\tfrac{1}{6}$, $\tfrac{1}{12}$, $\tfrac{1}{24}$ are applied once at the end.

On the same pass the smallest and largest $x$ and $y$ of all vertices are recorded: $x_{\min}$, $x_{\max}$, $y_{\min}$, $y_{\max}$. They are used for the section moduli (section 11).

---

## 5. Orientation

If the vertices go clockwise, every $a_i$ changes sign, and so do all six sums. So if $A$ comes out negative, the algorithm flips the sign of all six:

$$A,\ Q_{x0},\ Q_{y0},\ I_{x0},\ I_{y0},\ I_{xy0} \;\rightarrow\; -A,\ -Q_{x0},\ -Q_{y0},\ -I_{x0},\ -I_{y0},\ -I_{xy0}$$

As a result, a polygon gives the same properties whichever way its vertices go. The app's shapes are clockwise and are reversed in section 1, so for them this flip never happens; it is there for any other input.

---

## 6. Centroid

$$\bar{x} = \frac{Q_{y0}}{A}, \qquad \bar{y} = \frac{Q_{x0}}{A}$$

The centroid is in the same coordinates as the input vertices.

---

## 7. Centroidal moments of inertia (parallel axis theorem)

The moments from section 4 are about the origin. The parallel axis theorem moves them to axes through the centroid, parallel to X and Y:

$$I_x = I_{x0} - A\,\bar{y}^2$$

$$I_y = I_{y0} - A\,\bar{x}^2$$

$$I_{xy} = I_{xy0} - A\,\bar{x}\,\bar{y}$$

These are the $I_x$, $I_y$ and $I_{xy}$ that the app shows. $I_{xy} = 0$ when the section is symmetric about either centroidal axis.

<small>**Note: why minus and not plus?** Books usually write the parallel axis theorem as $I = I_c + A\,d^2$. It moves a moment *away from* the centroid $c$ to a parallel axis at distance $d$. Here we go the other way: the sums give the moment about the origin, $I_{x0} = I_x + A\,\bar{y}^2$, and solving that for the centroidal $I_x$ gives the minus sign. For example, a $b \times h$ rectangle from $y = 0$ to $y = h$ has $I_{x0} = \tfrac{b h^3}{3}$ and $\bar{y} = \tfrac{h}{2}$, so $I_x = \tfrac{b h^3}{3} - b h \cdot \tfrac{h^2}{4} = \tfrac{b h^3}{12}$, the textbook value. The centroidal axis always has the smallest moment of all parallel axes, so moving to it has to subtract. The FEM and composite solvers go the book's way, from each part's own centroid out to the centroid of the whole, so they use the plus sign.</small>


---

## 8. Principal axes

The principal axes are the two perpendicular centroidal axes where $I_{xy}$ is zero. About them the moment of inertia is at its largest ($U$ axis) and smallest ($V$ axis).

**Angle.** The angle of the $U$ axis, counterclockwise from the X axis, is found the same way by this, the composite, the FEM and the hollow rectangle solvers:

$$\theta_p = \frac{1}{2} \arctan\!\left(\frac{-2\,I_{xy}}{I_x - I_y}\right)$$

The angle $2\theta_p$ is taken in the quadrant of the point $(I_x - I_y,\; -2\,I_{xy})$, with $-180° < 2\theta_p \le 180°$. The quadrant is what makes $\theta_p$ the angle of the $U$ axis and not of the $V$ axis. For $I_x = I_y$ the fraction is undefined and $2\theta_p = \pm 90°$, with the sign of $-2\,I_{xy}$.

This gives $\theta_p$ between $-90°$ and $90°$. It is shown in degrees.

**Symmetric sections.** When $I_{xy}$ is really zero, the formula above can't be trusted. Rounding leaves a tiny $I_{xy}$ (for example $10^{-11}$), and its random sign decides between $0°$, $+90°$ and $-90°$, or $\pm 45°$ for a square where $I_x = I_y$. So the algorithm first checks whether $I_{xy}$ is just noise, measured against the size of the inertias:

$$|I_{xy}| \le 10^{-9} \cdot \max(|I_x|, |I_y|)$$

If it is, the axes are taken to be X and Y, and the angle is chosen from the two inertias:

*   $\theta_p = 0$ when $I_x - I_y \ge -10^{-9} \cdot \max(|I_x|, |I_y|)$, which means X is the strong axis, and also covers a square ($I_x = I_y$),
*   $\theta_p = 90°$ otherwise (Y is the strong axis).

**Principal moments of inertia:**

$$I_u = \frac{I_x + I_y}{2} + \sqrt{\left(\frac{I_x - I_y}{2}\right)^2 + I_{xy}^2}$$

$$I_v = \frac{I_x + I_y}{2} - \sqrt{\left(\frac{I_x - I_y}{2}\right)^2 + I_{xy}^2}$$

$I_u \ge I_v$ always, and $I_u + I_v = I_x + I_y$.

---

## 9. Polar moment of inertia

$$I_p = I_x + I_y$$

This is the polar moment about the centroid. It is **not** the torsion constant $J$ of the section. The two are the same only for a solid or hollow circle; for open sections such as I, C or L shapes, $J$ is much smaller than $I_p$.

---

## 10. Radii of gyration

$$r_x = \sqrt{\frac{I_x}{A}}, \qquad r_y = \sqrt{\frac{I_y}{A}}, \qquad r_u = \sqrt{\frac{I_u}{A}}, \qquad r_v = \sqrt{\frac{I_v}{A}}$$

$r_v$ is the smallest of the four, and is the one that matters for the buckling of a column.

---

## 11. Elastic section moduli

The farthest point of a polygon in any direction is always one of its vertices, so the vertex extremes from section 4 give the exact distances from the centroid to the outermost fibers:

$$c_{\text{top}} = y_{\max} - \bar{y}, \qquad c_{\text{bot}} = \bar{y} - y_{\min}, \qquad c_{\text{rt}} = x_{\max} - \bar{x}, \qquad c_{\text{lf}} = \bar{x} - x_{\min}$$

$$W_{x,\text{top}} = \frac{I_x}{c_{\text{top}}}, \qquad W_{x,\text{bot}} = \frac{I_x}{c_{\text{bot}}}, \qquad W_{y,\text{rt}} = \frac{I_y}{c_{\text{rt}}}, \qquad W_{y,\text{lf}} = \frac{I_y}{c_{\text{lf}}}$$

If a distance is zero or negative (a degenerate shape), that modulus is returned as $0$ instead of dividing by it.

These moduli are about the X and Y axes only. No moduli about the principal axes $U$ and $V$ are computed.

---

## 12. Rounding

Every value is computed at full floating point precision, and only the returned values are rounded, to the requested number of decimals (2 by default). A value that rounds to zero is always shown as $0$, so a value like $-0.001$ is never shown as $-0.00$.

Callers that use the result for further math ask for more decimals, so rounding errors don't add up: the FEM solver uses 10 decimals for each triangle, and the hollow rectangle uses 8 decimals for each of its two rings.

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

*   C. Steger, *On the Calculation of Arbitrary Moments of Polygons*, Technical Report FGBV-96-05, TU München, 1996.
*   Dr. Drang, *Green's theorem and section properties*, leancrew.com, 2018.
