import type { Geometry } from "../../../../interfaces/beams/common.types";
import { SHAPE_TYPES } from "../../../../interfaces/beams/common.types";
import type { CSectionGeometry } from "../../../../interfaces/beams/CSection.types";
import type { ISectionGeometry } from "../../../../interfaces/beams/ISection.types";
import type { LSectionGeometry } from "../../../../interfaces/beams/LSection.types";
import type { OSectionGeometry, OSectionHollowGeometry } from "../../../../interfaces/beams/OSection.types";
import type {
	HollowRectangleGeometry,
	RectangleGeometry,
	RoundedHollowRectangleGeometry,
	RoundedRectangleGeometry,
} from "../../../../interfaces/beams/RectSection.types";
import type { TSectionGeometry } from "../../../../interfaces/beams/TSection.types";
import type { ZSectionGeometry } from "../../../../interfaces/beams/ZSection.types";
import type { Point } from "../../../../interfaces/common/types";
import type { DrawableTarget } from "../../../middle/view/canvas/DrawTargetsCollection";
import { getCSectionAnnotations } from "./cSectionAnnotations";
import { getHollowRectangleAnnotations } from "./hollowRectangleAnnotations";
import { getISectionAnnotations } from "./iSectionAnnotations";
import { getLSectionAnnotations } from "./lSectionAnnotations";
import { getRectangleAnnotations } from "./rectangleAnnotations";
import { getTSectionAnnotations } from "./tSectionAnnotations";
import { getHollowTubeAnnotations, getTubeAnnotations } from "./tubeAnnotations";
import { getZSectionAnnotations } from "./zSectionAnnotations";

/**
 * Static size annotations for a shape, labels only; sizes come from the geometry.
 * Add a case here for every shape that gets annotations. Shapes without a polygon
 * strategy yet (S, fillet, triangle) have none.
 */
export function buildAnnotations(geometry: Geometry, centroid: Point): DrawableTarget[] {
	switch (geometry.type) {
		case SHAPE_TYPES.I_SECTION:
			return getISectionAnnotations(geometry as ISectionGeometry, centroid);
		case SHAPE_TYPES.C_SECTION:
			return getCSectionAnnotations(geometry as CSectionGeometry, centroid);
		case SHAPE_TYPES.T_SECTION:
			return getTSectionAnnotations(geometry as TSectionGeometry, centroid);
		case SHAPE_TYPES.Z_SECTION:
			return getZSectionAnnotations(geometry as ZSectionGeometry, centroid);
		case SHAPE_TYPES.L_SECTION:
			return getLSectionAnnotations(geometry as LSectionGeometry, centroid);
		case SHAPE_TYPES.RECTANGLE:
		case SHAPE_TYPES.ROUNDED_RECTANGLE:
			return getRectangleAnnotations(geometry as RectangleGeometry | RoundedRectangleGeometry, centroid);
		case SHAPE_TYPES.HOLLOW_RECTANGLE:
		case SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE:
			return getHollowRectangleAnnotations(geometry as HollowRectangleGeometry | RoundedHollowRectangleGeometry, centroid);
		case SHAPE_TYPES.TUBE:
			return getTubeAnnotations(geometry as OSectionGeometry, centroid);
		case SHAPE_TYPES.HOLLOW_TUBE:
			return getHollowTubeAnnotations(geometry as OSectionHollowGeometry, centroid);
		default:
			return [];
	}
}
