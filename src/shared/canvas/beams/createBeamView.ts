import { SHAPE_TYPES } from "@/shared/shapes/types/common.types";
import { GenericBeamView } from "./GenericBeamView";
import type { BeamViewData, BeamViewDeps, GenericBeamViewParams } from "./GenericBeamView.types";
import { HollowRectangleBeam } from "./HollowRectangleBeam";
import { HollowTubeBeam } from "./HollowTubeBeam";

const specialBeamMap = {
	[SHAPE_TYPES.HOLLOW_TUBE]: HollowTubeBeam,
	[SHAPE_TYPES.HOLLOW_RECTANGLE]: HollowRectangleBeam,
	[SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE]: HollowRectangleBeam,
} as const;

/** Builds the beam class that draws the shape stored under `uid`: a special one for hollow shapes, the generic one otherwise */
export function createBeamView(uid: string, data: BeamViewData, deps: BeamViewDeps): GenericBeamView {
	const geometryData = data.geometry[uid];
	const BeamClass = specialBeamMap[geometryData?.type as keyof typeof specialBeamMap] ?? GenericBeamView;
	const params: GenericBeamViewParams = { uid, data, deps };
	return new BeamClass(params as any);
}
