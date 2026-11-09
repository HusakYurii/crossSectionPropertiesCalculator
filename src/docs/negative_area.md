# Positive and Negative Shapes

Every shape on the canvas is either **positive** or **negative**. A new shape is positive by default. You can make it negative with the Shape sign selector in the shape's form.

*   A **positive shape** adds material to the section.
*   A **negative shape** removes material. Use it for cut-outs and holes, for example fastener holes or lightening holes.

## How it is used in the math

Each shape has a sign $s_i$: $+1$ for a positive shape and $-1$ for a negative one. The sign multiplies everything the shape contributes to the whole section:

$$A = \sum_i s_i\,A_i, \qquad I_x = \sum_i s_i \left( I_{x,i} + A_i\,d_{y,i}^2 \right)$$

Here $d_{y,i}$ is the Y distance from the shape's centroid to the centroid of the whole section. $I_y$ and $I_{xy}$ follow the same pattern. This is what each step of the math does with a negative shape:

1.  **Area.** The area of the negative shape is subtracted from the total.
2.  **Centroid.** The first moment of the negative shape is subtracted too, $\bar{y} = \sum_i s_i\,A_i\,y_i \,/\, A$ and the same for $\bar{x}$. So a hole on one side moves the centroid of the whole section to the other side.
3.  **Moments of inertia.** Both the inertia of the shape about its own centroid and its parallel axis term $A_i\,d^2$ are subtracted. So a hole far from the centroid takes away much more than a hole near it.
4.  **Outermost fibers.** Negative shapes are skipped. The distances $c$ in the section moduli $W = I / c$ come from the positive shapes only.

The full algorithm is in "Cross-Section Properties of a Built-Up Section".

## Rules

The math treats every shape on its own and does not intersect or clip the shapes, so the layout is up to you:

1.  **A negative shape must always lie completely inside the positive shapes.** It must not be placed outside them or stick out of them. If it does, the math still subtracts the full area and inertia of the shape, including the part where there is no material.
2.  **Negative shapes must not overlap each other.** Each one is subtracted in full, so the math subtracts the overlap twice.
3.  **A cut-out that removes a whole outer strip** of a positive shape makes the section modulus on that side too small, because the math still takes the outermost fiber from the positive shape, so $c$ is too large.

The math only checks the totals. It shows an error if $A \le 0$, $I_x \le 0$, $I_y \le 0$, or the smallest principal moment of inertia $I_v < 0$. A negative shape outside the positive shapes often keeps these totals valid, so there is no error and the results are wrong without any warning.
