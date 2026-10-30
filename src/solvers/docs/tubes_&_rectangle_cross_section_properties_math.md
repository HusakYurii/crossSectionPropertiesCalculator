# Complete Structural Section Properties Reference Sheet

This document compiles the analytical engineering formulas for calculating the geometric, principal, elastic, plastic, and torsional cross-sectional properties for circular and rectangular profiles.

---

## 1. Solid Circular Rod / Bar
Given **outer diameter ($D$)** or **outer radius ($R = D / 2$)*:

### Geometric Fundamentals
* **Total Area ($A$)**: 
  $$A = \frac{\pi D^2}{4} = \pi R^2$$
* **Moment of Inertia, X-axis ($I_x$)**: 
  $$I_x = \frac{\pi D^4}{64} = \frac{\pi R^4}{4}$$
* **Moment of Inertia, Y-axis ($I_y$)**: 
  $$I_y = \frac{\pi D^4}{64} = \frac{\pi R^4}{4}$$
* **Product Moment of Inertia ($I_{xy}$)**: 
  $$I_{xy} = 0 \quad \text{(Due to perfect radial symmetry)}$$
* **Polar Moment of Inertia ($I_p$)**: 
  $$I_p = I_x + I_y = \frac{\pi D^4}{32} = \frac{\pi R^4}{2}$$
* **Radius of Gyration ($r_x, r_y$)**: 
  $$r_x = r_y = \sqrt{\frac{I_x}{A}} = \frac{D}{4} = \frac{R}{2}$$

### Principal Properties
* **Principal Rotation Angle ($\theta_p$)**: 
  $$\theta_p = 0 \text{ rad} \quad \text{(Every centroidal axis is a principal axis)}$$
* **Maximum & Minimum Principal Inertia ($I_u, I_v$)**: 
  $$I_u = I_v = I_x = I_y$$
* **Maximum & Minimum Principal Radius of Gyration ($r_u, r_v$)**: 
  $$r_u = r_v = r_x = r_y$$

### Section Moduli (Elastic & Plastic)
* **Elastic Section Modulus ($W_x, W_y$)**: 
  $$W_x = W_y = \frac{I_x}{D / 2} = \frac{\pi D^3}{32} = \frac{\pi R^3}{4}$$
* **Plastic Section Modulus ($Z_x, Z_y$)**: 
  $$Z_x = Z_y = \frac{D^3}{6} = \frac{4R^3}{3}$$

### Torsional Constants
* **Torsional Constant ($J$)**: 
  $$J = I_p = \frac{\pi D^4}{32} = \frac{\pi R^4}{2} \quad \text{(Circular shapes do not warp under torsion)}$$

---

## 2. Hollow Circular Tube
Given **outer diameter ($D$)** / **outer radius ($R$)** and **inner diameter ($d$)** / **inner radius ($r$)**:

### Geometric Fundamentals
* **Total Area ($A$)**: 
  $$A = \frac{\pi}{4}(D^2 - d^2) = \pi(R^2 - r^2)$$
* **Moment of Inertia, X-axis ($I_x$)**: 
  $$I_x = \frac{\pi}{64}(D^4 - d^4) = \frac{\pi}{4}(R^4 - r^4)$$
* **Moment of Inertia, Y-axis ($I_y$)**: 
  $$I_y = \frac{\pi}{64}(D^4 - d^4) = \frac{\pi}{4}(R^4 - r^4)$$
* **Product Moment of Inertia ($I_{xy}$)**: 
  $$I_{xy} = 0$$
* **Polar Moment of Inertia ($I_p$)**: 
  $$I_p = I_x + I_y = \frac{\pi}{32}(D^4 - d^4) = \frac{\pi}{2}(R^4 - r^4)$$
* **Radius of Gyration ($r_x, r_y$)**: 
  $$r_x = r_y = \sqrt{\frac{I_x}{A}} = \frac{\sqrt{D^2 + d^2}}{4} = \frac{\sqrt{R^2 + r^2}}{2}$$

### Principal Properties
* **Principal Rotation Angle ($\theta_p$)**: 
  $$\theta_p = 0 \text{ rad}$$
* **Maximum & Minimum Principal Inertia ($I_u, I_v$)**: 
  $$I_u = I_v = I_x = I_y$$
* **Maximum & Minimum Principal Radius of Gyration ($r_u, r_v$)**: 
  $$r_u = r_v = r_x = r_y$$

### Section Moduli (Elastic & Plastic)
* **Elastic Section Modulus ($W_x, W_y$)**: 
  $$W_x = W_y = \frac{I_x}{D / 2} = \frac{\pi (D^4 - d^4)}{32 D} = \frac{\pi (R^4 - r^4)}{4 R}$$
* **Plastic Section Modulus ($Z_x, Z_y$)**: 
  $$Z_x = Z_y = \frac{D^3 - d^3}{6} = \frac{4(R^3 - r^3)}{3}$$

### Torsional Constants
* **Torsional Constant ($J$)**: 
  $$J = I_p = \frac{\pi}{32}(D^4 - d^4) = \frac{\pi}{2}(R^4 - r^4)$$

---

## 3. Solid Rectangle
Given **outer width ($w$)** and **outer height ($h$)**:

### Geometric Fundamentals
* **Total Area ($A$)**: 
  $$A = w \cdot h$$
* **Moment of Inertia, X-axis ($I_x$)**: 
  $$I_x = \frac{w \cdot h^3}{12}$$
* **Moment of Inertia, Y-axis ($I_y$)**: 
  $$I_y = \frac{h \cdot w^3}{12}$$
* **Product Moment of Inertia ($I_{xy}$)**: 
  $$I_{xy} = 0$$
* **Polar Moment of Inertia ($I_p$)**: 
  $$I_p = I_x + I_y$$
* **Radius of Gyration ($r_x, r_y$)**: 
  $$r_x = \frac{h}{\sqrt{12}}, \quad r_y = \frac{w}{\sqrt{12}}$$

### Principal Properties
* **Principal Rotation Angle ($\theta_p$)**: 
  $$\theta_p = 0 \text{ rad}$$
* **Maximum / Minimum Inertia ($I_u, I_v$)**: 
  $$I_u = \max(I_x, I_y), \quad I_v = \min(I_x, I_y)$$
* **Maximum / Minimum Radius of Gyration ($r_u, r_v$)**: 
  $$r_u = \max(r_x, r_y), \quad r_v = \min(r_x, r_y)$$

### Section Moduli (Elastic & Plastic)
* **Elastic Section Modulus ($W_x, W_y$)**: 
  $$W_x = \frac{I_x}{h / 2} = \frac{w \cdot h^2}{6}, \quad W_y = \frac{I_y}{w / 2} = \frac{h \cdot w^2}{6}$$
* **Plastic Section Modulus ($Z_x, Z_y$)**: 
  $$Z_x = \frac{w \cdot h^2}{4}, \quad Z_y = \frac{h \cdot w^2}{4}$$

### Torsional Constants
* **Torsional Constant ($J$)** *(Saint-Venant's approximation where $b = \max(w,h)$ and $t = \min(w,h)$)*:
  $$J = b \cdot t^3 \left[ \frac{1}{3} - 0.21 \frac{t}{b} \left( 1 - \frac{t^4}{12 b^4} \right) \right]$$

---

## 4. Hollow Rectangle (Tube)
Given **outer width ($w$)**, **outer height ($h$)**, and **wall thickness ($r$)**:

* **Inner Dimensions**: $w_{\text{in}} = w - 2r$ and $h_{\text{in}} = h - 2r$

### Geometric Fundamentals
* **Total Area ($A$)**: 
  $$A = (w \cdot h) - (w_{\text{in}} \cdot h_{\text{in}})$$
* **Moment of Inertia, X-axis ($I_x$)**: 
  $$I_x = \frac{w \cdot h^3 - w_{\text{in}} \cdot h_{\text{in}}^3}{12}$$
* **Moment of Inertia, Y-axis ($I_y$)**: 
  $$I_y = \frac{h \cdot w^3 - h_{\text{in}} \cdot w_{\text{in}}^3}{12}$$
* **Product Moment of Inertia ($I_{xy}$)**: 
  $$I_{xy} = 0$$
* **Polar Moment of Inertia ($I_p$)**: 
  $$I_p = I_x + I_y$$
* **Radius of Gyration ($r_x, r_y$)**: 
  $$r_x = \sqrt{\frac{I_x}{A}}, \quad r_y = \sqrt{\frac{I_y}{A}}$$

### Principal Properties
* **Principal Rotation Angle ($\theta_p$)**: 
  $$\theta_p = 0 \text{ rad}$$
* **Maximum / Minimum Inertia ($I_u, I_v$)**: 
  $$I_u = \max(I_x, I_y), \quad I_v = \min(I_x, I_y)$$
* **Maximum / Minimum Radius of Gyration ($r_u, r_v$)**: 
  $$r_u = \max(r_x, r_y), \quad r_v = \min(r_x, r_y)$$

### Section Moduli (Elastic & Plastic)
* **Elastic Section Modulus ($W_x, W_y$)**: 
  $$W_x = \frac{I_x}{h / 2}, \quad W_y = \frac{I_y}{w / 2}$$
* **Plastic Section Modulus ($Z_x, Z_y$)**: 
  $$Z_x = \frac{w \cdot h^2 - w_{\text{in}} \cdot h_{\text{in}}^2}{4}, \quad Z_y = \frac{h \cdot w^2 - h_{\text{in}} \cdot w_{\text{in}}^2}{4}$$

### Torsional Constants
* **Torsional Constant ($J$)** *(Bredt's Thin-Walled Tube Approximation)*:
  * Mean enclosed dimensions: $w_m = w - r$ and $h_m = h - r$
  * Mean area enclosed by centerlines: $A_m = w_m \cdot h_m$
  * Centerline perimeter length: $s = 2(w_m + h_m)$
  $$J = \frac{4 \cdot A_m^2 \cdot r}{s}$$
