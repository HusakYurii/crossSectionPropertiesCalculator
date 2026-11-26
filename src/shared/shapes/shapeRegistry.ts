import type { Geometry } from "./types/common.types";
import { SHAPE_TYPES } from "./types/common.types";
import type { CSectionGeometry } from "./types/CSection.types";
import type { ISectionGeometry } from "./types/ISection.types";
import type { LSectionGeometry } from "./types/LSection.types";
import type { OSectionGeometry, OSectionHollowGeometry } from "./types/OSection.types";
import type {
	HollowRectangleGeometry,
	RectangleGeometry,
	RoundedHollowRectangleGeometry,
	RoundedRectangleGeometry,
} from "./types/RectSection.types";
import type { TSectionGeometry } from "./types/TSection.types";
import type { ZSectionGeometry } from "./types/ZSection.types";
import type { Point } from "@/shared/types/geometry";
import type { DrawableTarget } from "@/shared/canvas";
import { C_SECTION_FIELDS } from "./cSection/fields";
import { getCSectionAnnotations } from "./cSection/staticAnnotations";
import { HOLLOW_RECTANGLE_FIELDS, CORNER_RADIUS_FIELD as HOLLOW_RECT_CORNER_RADIUS_FIELD } from "./hollowRectSection/fields";
import { getHollowRectangleAnnotations } from "./hollowRectSection/staticAnnotations";
import { I_SECTION_FIELDS } from "./iSection/fields";
import { getISectionAnnotations } from "./iSection/staticAnnotations";
import { L_SECTION_FIELDS } from "./lSection/fields";
import { getLSectionAnnotations } from "./lSection/staticAnnotations";
import { RECTANGLE_FIELDS, CORNER_RADIUS_FIELD as RECT_CORNER_RADIUS_FIELD } from "./rectSection/fields";
import { getRectangleAnnotations } from "./rectSection/staticAnnotations";
import { T_SECTION_FIELDS } from "./tSection/fields";
import { getTSectionAnnotations } from "./tSection/staticAnnotations";
import { TUBE_FIELDS, INNER_DIAMETER_FIELD } from "./tubeSection/fields";
import { getHollowTubeAnnotations, getTubeAnnotations } from "./tubeSection/staticAnnotations";
import { Z_SECTION_FIELDS } from "./zSection/fields";
import { getZSectionAnnotations } from "./zSection/staticAnnotations";
import type { ShapeField } from "./types/shapeField.types";

/**
 * Static size annotations for a shape, labels only; sizes come from the geometry.
 * Add a case here for every shape that gets annotations; each shape's annotations
 * live in its own folder (<shape>/staticAnnotations.ts, fields in <shape>/fields.ts).
 * Shapes without a polygon strategy yet (S, fillet, triangle) have none.
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

// the lookup the report uses to list a shape's parameters
export const SHAPE_FIELDS: Partial<Record<keyof typeof SHAPE_TYPES, ShapeField[]>> = {
	I_SECTION: I_SECTION_FIELDS,
	C_SECTION: C_SECTION_FIELDS,
	Z_SECTION: Z_SECTION_FIELDS,
	T_SECTION: T_SECTION_FIELDS,
	L_SECTION: L_SECTION_FIELDS,
	RECTANGLE: RECTANGLE_FIELDS,
	ROUNDED_RECTANGLE: [...RECTANGLE_FIELDS, RECT_CORNER_RADIUS_FIELD],
	HOLLOW_RECTANGLE: HOLLOW_RECTANGLE_FIELDS,
	HOLLOW_ROUNDED_RECTANGLE: [...HOLLOW_RECTANGLE_FIELDS, HOLLOW_RECT_CORNER_RADIUS_FIELD],
	TUBE: TUBE_FIELDS,
	HOLLOW_TUBE: [...TUBE_FIELDS, INNER_DIAMETER_FIELD],
};
