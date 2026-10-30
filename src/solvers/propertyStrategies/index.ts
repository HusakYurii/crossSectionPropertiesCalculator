import type { PropertiesBuildStrategy } from "./AbstractPropertiesStrategy";
import { CSectionPropertiesStrategy } from "./CSectionPropertiesStrategy";
import { ISectionPropertiesStrategy } from "./ISectionPropertiesStrategy";
import { LSectionPropertiesStrategy } from "./LSectionPropertiesStrategy";
import { ZSectionPropertiesStrategy } from "./ZSectionPropertiesStrategy";
import { TSectionPropertiesStrategy } from "./TSectionPropertiesStrategy";
import { CustomShapePropertiesStrategy } from "./CustomShapePropertiesStrategy";
import { RectanglePropertiesStrategy } from "./RectanglePropertiesStrategy";
import { RoundedRectanglePropertiesStrategy } from "./RoundedRectanglePropertiesStrategy";
import { TubePropertiesStrategy } from "./TubePropertiesStrategy";
import { HollowTubePropertiesStrategy } from "./HollowTubePropertiesStrategy";
import { HollowRectanglePropertiesStrategy } from "./HollowRectanglePropertiesStrategy";

export const propertiesBuildStrategies: PropertiesBuildStrategy[] = [
	new CSectionPropertiesStrategy(),
	new ISectionPropertiesStrategy(),
	new LSectionPropertiesStrategy(),
	new ZSectionPropertiesStrategy(),
	new TSectionPropertiesStrategy(),
	new CustomShapePropertiesStrategy(),
	new RectanglePropertiesStrategy(),
	new RoundedRectanglePropertiesStrategy(),
	new TubePropertiesStrategy(),
	new HollowTubePropertiesStrategy(),
	new HollowRectanglePropertiesStrategy(),
];
