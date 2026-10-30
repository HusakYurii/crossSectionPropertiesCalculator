# Cross-Sectional Property Formulas via Green's Theorem

This document outlines the complete mathematical framework based on **Green’s Theorem** for an arbitrary 2D polygon with $n$ vertices. The vertices must be ordered sequentially along the perimeter. 

An automatic wraparound indexing convention is used: if $i = n - 1$, the next index is $i + 1 = 0$.

---

## 1. Line Integrals via Green's Theorem (Theoretical Basis)

$$A = \frac{1}{2} \oint_C (x \, dy - y \, dx)$$

$$Q_{x0} = \frac{1}{2} \oint_C y^2 \, dx = -\oint_C xy \, dy = \frac{1}{3} \oint_C y^2 \, dx - xy \, dy$$

$$I_{x0} = \frac{1}{3} \oint_C y^3 \, dx$$

$$I_{y0} = -\frac{1}{3} \oint_C x^3 \, dy$$

---

## 2. Segment Area Factor

For each polygon edge from vertex $i$ to $i+1$:
$$a_i = x_i y_{i+1} - x_{i+1} y_i$$

---

## 3. Base Geometric Properties & Global Moments

*   **Total Cross-Sectional Area ($A$):**
    $$A = \frac{1}{2} \sum_{i=0}^{n-1} a_i$$

*   **First Moment of Area about the Global X-axis ($Q_{x0}$):**
    $$Q_{x0} = \frac{1}{6} \sum_{i=0}^{n-1} a_i (y_i + y_{i+1})$$

*   **First Moment of Area about the Global Y-axis ($Q_{y0}$):**
    $$Q_{y0} = \frac{1}{6} \sum_{i=0}^{n-1} a_i (x_i + x_{i+1})$$

*   **Global Centroid Coordinates ($	ext{centroid}_x, \text{centroid}_y$):**
    $$\text{centroid}_x = \frac{Q_{y0}}{A}$$
    $$\text{centroid}_y = \frac{Q_{x0}}{A}$$

---

## 4. Raw Moments of Inertia (Global Origin)

*   **Moment of Inertia about Global X-axis ($I_{x0}$):**
    $$I_{x0} = \frac{1}{12} \sum_{i=0}^{n-1} a_i (y_i^2 + y_i y_{i+1} + y_{i+1}^2)$$

*   **Moment of Inertia about Global Y-axis ($I_{y0}$):**
    $$I_{y0} = \frac{1}{12} \sum_{i=0}^{n-1} a_i (x_i^2 + x_i x_{i+1} + x_{i+1}^2)$$

*   **Product Moment of Inertia about Global Axes ($I_{xy0}$):**
    $$I_{xy0} = \frac{1}{24} \sum_{i=0}^{n-1} a_i (x_i y_{i+1} + 2x_i y_i + 2x_{i+1} y_{i+1} + x_{i+1} y_i)$$

---

## 5. Centroidal Moments of Inertia (Parallel Axis Theorem)

*   **Centroidal Moment of Inertia about Horizontal Axis ($I_x$):**
    $$I_x = I_{x0} - A (\text{centroid}_y)^2$$

*   **Centroidal Moment of Inertia about Vertical Axis ($I_y$):**
    $$I_y = I_{y0} - A (\text{centroid}_x)^2$$

*   **Centroidal Product Moment of Inertia ($I_{xy}$):**
    $$I_{xy} = I_{xy0} - A \cdot \text{centroid}_x \cdot \text{centroid}_y$$

---

## 6. Principal Axes & Rotated Inertias

*   **Principal Axis Rotation Angle ($\theta_{p\,\text{rad}}$):**
    $$\theta_{p\,\text{rad}} = \frac{1}{2} \operatorname{atan2}(-2I_{xy}, I_x - I_y)$$

*   **Maximum Principal Centroidal Moment of Inertia ($I_u$):**
    $$I_u = \frac{I_x + I_y}{2} + \sqrt{\left(\frac{I_x - I_y}{2}\right)^2 + I_{xy}^2}$$

*   **Minimum Principal Centroidal Moment of Inertia ($I_v$):**
    $$I_v = \frac{I_x + I_y}{2} - \sqrt{\left(\frac{I_x - I_y}{2}\right)^2 + I_{xy}^2}$$

---

## 7. Moduli, Torsion, and Slenderness

*   **Polar Moment of Inertia ($I_p$):**
    $$I_p = I_x + I_y$$

*   **Radius of Gyration about Centroidal Axes ($r_x, r_y$):**
    $$r_x = \sqrt{\frac{I_x}{A}}, \quad r_y = \sqrt{\frac{I_y}{A}}$$

*   **Principal Radii of Gyration ($r_u, r_v$):**
    $$r_u = \sqrt{\frac{I_u}{A}}, \quad r_v = \sqrt{\frac{I_v}{A}}$$

---

## 8. Elastic Section Moduli

Given boundary distances:
*   $c_{\text{top}} = y_{\text{max}} - \text{centroid}_y$
*   $c_{\text{bot}} = \text{centroid}_y - y_{\text{min}}$
*   $c_{\text{rt}} = x_{\text{max}} - \text{centroid}_x$
*   $c_{\text{lf}} = \text{centroid}_x - x_{\text{min}}$

*   **Section Moduli for Bending about X-axis ($W_{x\,\text{top}}, W_{x\,\text{bot}}$):**
    $$W_{x\,\text{top}} = \frac{I_x}{c_{\text{top}}}, \quad W_{x\,\text{bot}} = \frac{I_x}{c_{\text{bot}}}$$

*   **Section Moduli for Bending about Y-axis ($W_{y\,\text{rt}}, W_{y\,\text{lf}}$):**
    $$W_{y\,\text{rt}} = \frac{I_y}{c_{\text{rt}}}, \quad W_{y\,\text{lf}} = \frac{I_y}{c_{\text{lf}}}$$