import type { Point } from '@/shared/types/geometry';

/**
 * Where the lines of one dimension go, in world coordinates. A subclass may work them out from
 * screen-pixel offsets, so they hold only for the zoom they were computed at.
 */
export type DimensionGeometry = {
	/** one end of the dimension line; gets an arrow head */
	from: Point;
	/** the other end of the dimension line; gets an arrow head */
	to: Point;
	/** solid [start, end] lines, usually from a measured point to just past the dimension line */
	extensionLines?: [Point, Point][];
	/** a dashed [start, end] line, e.g. back to the measured point once the dimension line is moved away from it */
	connector?: [Point, Point];
	/**
	 * Unit vectors pointing away from the dimension at each end. When set, the arrow heads sit outside the
	 * ends and point inward, the tip on the end. The subclass gives them so that a zero length stays safe.
	 */
	arrowsOutside?: { fromOutward: Point; toOutward: Point };
};
