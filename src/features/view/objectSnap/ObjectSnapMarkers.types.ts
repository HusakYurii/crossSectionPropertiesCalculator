import type { Point } from '@/shared/types/geometry';

/** the world points to mark; the selected and the hovered one are also in `shapes` */
export type ObjectSnapMarkerModel = {
	shapes: Array<{ uid: string; points: Point[] }>;
	selected: Point | null;
	hovered: Point | null;
};
