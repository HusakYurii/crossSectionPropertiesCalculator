# Cross Section Properties Calculation (Triangle-Based FEA)

This document contains the complete mathematical apparatus required to calculate the geometric properties of a cross section composed of triangular elements (commonly used in Finite Element Analysis).

Each triangle is solved on its own: its area, its centroid and its own moments of inertia about its own centroid. Those are then moved to the centroid of the whole section with the parallel axis theorem and added up.

---

## 1. Geometry and Input Data
Let a single triangular element on the $XY$ plane be defined by three vertices: $(x_1, y_1)$, $(x_2, y_2)$, and $(x_3, y_3)$. The order of the vertices does not matter, because the area below is taken as an absolute value.

---

## 2. Cross-Sectional Area ($A$)
The area of a single triangle $A_i$ is calculated using the determinant of the coordinate matrix (shoelace formula):

$$A_i = \frac{1}{2} |x_1(y_2 - y_3) + x_2(y_3 - y_1) + x_3(y_1 - y_2)|$$

For a total cross section made of $n$ triangles, the total area is:
$$A_{total} = \sum_{i=1}^{n} A_i$$

---

## 3. Centroid (Center of Gravity)
The centroid coordinates $(\bar{x}_i, \bar{y}_i)$ of an individual triangle are the arithmetic mean of its vertices:

$$\bar{x}_i = \frac{x_1 + x_2 + x_3}{3}, \quad \bar{y}_i = \frac{y_1 + y_2 + y_3}{3}$$

For the composite section, the global centroid coordinates $(X_c, Y_c)$ are derived using first moments of area:

$$X_c = \frac{\sum_{i=1}^{n} \bar{x}_i A_i}{A_{total}}, \quad Y_c = \frac{\sum_{i=1}^{n} \bar{y}_i A_i}{A_{total}}$$

---

## 4. Own Moments of Inertia of a Triangle (About Its Own Centroid)
Every triangle gets its own moments of inertia about axes parallel to $X$ and $Y$ that pass through its own centroid $(\bar{x}_i, \bar{y}_i)$. Two equivalent ways give the same numbers:

*   **Green's theorem:** the polygon solver (see `calculateCrossSectionProperties.md`) is run on the closed ring $(x_1,y_1) \to (x_2,y_2) \to (x_3,y_3) \to (x_1,y_1)$. It returns $A_i$, $(\bar{x}_i, \bar{y}_i)$ and the centroidal $I_{x,i}$, $I_{y,i}$, $I_{xy,i}$. This is what the code uses.

*   **Closed form:** with the vertex offsets from the triangle's own centroid $u_k = x_k - \bar{x}_i$ and $v_k = y_k - \bar{y}_i$:

    $$I_{x,i} = \frac{A_i}{12} \left( v_1^2 + v_2^2 + v_3^2 \right)$$

    $$I_{y,i} = \frac{A_i}{12} \left( u_1^2 + u_2^2 + u_3^2 \right)$$

    $$I_{xy,i} = \frac{A_i}{12} \left( u_1 v_1 + u_2 v_2 + u_3 v_3 \right)$$

Both agree to rounding error (about $10^{-13}$ relative) on test triangles, including one far from the origin.

---

## 5. Parallel Axis Theorem (Moving Each Triangle to the Section Centroid)
The own moments of every triangle are moved to the axes through the centroid of the whole section $(X_c, Y_c)$. With the distances between the two centroids

$$d_{x,i} = \bar{x}_i - X_c, \quad d_{y,i} = \bar{y}_i - Y_c$$

the parallel axis theorem gives, for each triangle:

$$I_{xc,i} = I_{x,i} + A_i \, d_{y,i}^2$$
$$I_{yc,i} = I_{y,i} + A_i \, d_{x,i}^2$$
$$I_{xyc,i} = I_{xy,i} + A_i \, d_{x,i} \, d_{y,i}$$

The centroidal properties of the whole section are the sums:

$$I_{xc} = \sum_{i=1}^{n} I_{xc,i}, \quad I_{yc} = \sum_{i=1}^{n} I_{yc,i}, \quad I_{xyc} = \sum_{i=1}^{n} I_{xyc,i}$$

Working with each triangle's own moments keeps the numbers small, so a section far from the origin loses no precision.

---

## 6. Principal Moments of Inertia and Principal Angle
The principal moments of inertia ($I_1, I_2$) and the orientation angle of the principal axes ($\theta$) are computed using:

$$I_{1,2} = \frac{I_{xc} + I_{yc}}{2} \pm \sqrt{\left(\frac{I_{xc} - I_{yc}}{2}\right)^2 + I_{xyc}^2}$$

$$\theta = \frac{1}{2} \operatorname{atan2}\left(-2 I_{xyc}, \; I_{xc} - I_{yc}\right)$$

---

## 7. Radii of Gyration, Polar Moment and Section Moduli
These steps do not depend on the mesh, only on the totals above:

$$I_p = I_{xc} + I_{yc}, \qquad r_x = \sqrt{\frac{I_{xc}}{A_{total}}}, \quad r_y = \sqrt{\frac{I_{yc}}{A_{total}}}, \quad r = \sqrt{\frac{I_{1,2}}{A_{total}}}$$

With $c_{top}, c_{bot}, c_{rt}, c_{lf}$ the distances from the centroid to the extreme fibers of the section boundary:

$$W_{x,top} = \frac{I_{xc}}{c_{top}}, \quad W_{x,bot} = \frac{I_{xc}}{c_{bot}}, \quad W_{y,rt} = \frac{I_{yc}}{c_{rt}}, \quad W_{y,lf} = \frac{I_{yc}}{c_{lf}}$$

---

## 8. FEA Implementation Algorithm
1. **Loop through all triangles:** Calculate $A_i$, $(\bar{x}_i, \bar{y}_i)$ and the own moments $I_{x,i}$, $I_{y,i}$, $I_{xy,i}$ about the triangle's own centroid.
2. **Accumulate:** Sum up the total area and calculate the global centroid $(X_c, Y_c)$ as the area-weighted mean of the triangle centroids.
3. **Shift:** Move each triangle's own moments to the global centroid with the parallel axis theorem and add them up.
4. **Solve Principal Matrix:** Calculate $I_1$, $I_2$ and the principal angle $\theta$, then the radii and moduli.
