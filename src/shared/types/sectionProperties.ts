/**
 * Represents the complete set of structural cross-sectional properties
 * using a flat structure and standard engineering notation keys.
 */
export interface CrossSectionProperties {
	// ===  Base Geometric Properties ===
	/** A: Total cross-sectional area */
	A: number
	/** x_bar: Centroid X coordinate relative to origin */
	centroid_x: number;
	/** y_bar: Centroid Y coordinate relative to origin */
	centroid_y: number;

	/** Ix: Centroidal moment of inertia about the horizontal axis */
	Ix: number;
	/** Iy: Centroidal moment of inertia about the vertical axis */
	Iy: number;
	/** Ixy: Centroidal product moment of inertia (asymmetry index) */
	Ixy: number;

	// ===  Principal Axes & Rotated Inertias ===
	/** theta_p_deg: Principal axis rotation angle in degrees, counterclockwise from the X axis */
	theta_p_deg: number;
	/** I_max: Maximum principal centroidal moment of inertia (I_u) */
	I_u: number;
	/** I_min: Minimum principal centroidal moment of inertia (I_v) */
	I_v: number;

	// === Moduli, Torsion, and Slenderness ===
	/** Ip: Polar moment of inertia (J) */
	Ip: number;
	/** rx: Radius of gyration relative to centroidal X-axis */
	rx: number;
	/** ry: Radius of gyration relative to centroidal Y-axis */
	ry: number;
	/** r_max: Maximum principal radius of gyration */
	r_u: number;
	/** r_min: Minimum principal radius of gyration (weakest buckling axis) */
	r_v: number;

	// === Section Moduli (Elastic) ===
	/** Wx_top: Elastic section modulus for the topmost extreme fiber */
	Wx_top: number;
	/** Wx_bot: Elastic section modulus for the bottommost extreme fiber */
	Wx_bot: number;
	/** Wy_rt: Elastic section modulus for the rightmost extreme fiber */
	Wy_rt: number;
	/** Wy_lf: Elastic section modulus for the leftmost extreme fiber */
	Wy_lf: number;
}

export const CROSS_SECTION_UNITS: Record<keyof CrossSectionProperties, string> = {
	A: 'mm^2',
	centroid_x: 'mm',
	centroid_y: 'mm',
	Ix: 'mm^4',
	Iy: 'mm^4',
	Ixy: 'mm^4',
	theta_p_deg: 'deg',
	I_u: 'mm^4',
	I_v: 'mm^4',
	Ip: 'mm^4',
	rx: 'mm',
	ry: 'mm',
	r_u: 'mm',
	r_v: 'mm',
	Wx_top: 'mm^3',
	Wx_bot: 'mm^3',
	Wy_rt: 'mm^3',
	Wy_lf: 'mm^3',
};


export const EMPTY_CROSS_SECTION_PROPERTIES: CrossSectionProperties = {
	A: 0,
	centroid_x: 0,
	centroid_y: 0,
	Ix: 0,
	Iy: 0,
	Ixy: 0,
	theta_p_deg: 0,
	I_u: 0,
	I_v: 0,
	Ip: 0,
	rx: 0,
	ry: 0,
	r_u: 0,
	r_v: 0,
	Wx_top: 0,
	Wx_bot: 0,
	Wy_rt: 0,
	Wy_lf: 0,
};
