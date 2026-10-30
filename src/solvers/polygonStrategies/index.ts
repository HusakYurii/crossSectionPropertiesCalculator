import type { PolygonBuildStrategy } from "./AbstractPolygonBuildStrategy";
import { CSectionStrategy } from "./CSectionStrategy";
import { ISectionStrategy } from "./ISectionStrategy";
import { LSectionStrategy } from "./LSectionStrategy";
import { ZSectionStrategy } from "./ZSectionStrategy";
import { TSectionStrategy } from "./TSectionStrategy";
import { CustomShapeStrategy } from "./CustomShapeStrategy";
import { RectangleStrategy } from "./RectangleStrategy";
import { RoundedRectangleStrategy } from "./RoundedRectangleStrategy";
import { TubeStrategy } from "./TubeStrategy";
import { HollowTubeStrategy } from "./HollowTubeStrategy";
import { HollowRectangleStrategy } from "./HollowRectangleStrategy";

export const polygonBuildStrategies: PolygonBuildStrategy[] = [
	new CSectionStrategy(),
	new ISectionStrategy(),
	new LSectionStrategy(),
	new ZSectionStrategy(),
	new TSectionStrategy(),
	new CustomShapeStrategy(),
	new RectangleStrategy(),
	new RoundedRectangleStrategy(),
	new TubeStrategy(),
	new HollowTubeStrategy(),
	new HollowRectangleStrategy(),
];
