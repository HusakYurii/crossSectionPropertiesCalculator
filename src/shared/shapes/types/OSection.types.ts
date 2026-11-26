import type { Geometry } from "./common.types";

export interface OSectionGeometry extends Geometry {
	type: 'TUBE'
	d1: number;
}

export interface OSectionHollowGeometry extends Omit<OSectionGeometry, 'type'> {
	type: 'HOLLOW_TUBE'
	d2: number;
}

