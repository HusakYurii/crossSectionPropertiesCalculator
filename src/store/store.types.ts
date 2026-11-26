import type { Point } from '@/shared/types/geometry';

export type GeometryDataExtra = {
	name: string;
	position: Point; // the centroid of each shape in world coordinates, is used to draw them on canvas and calculate overall props
};
