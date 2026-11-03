import { SHAPE_TYPES } from "../../../../interfaces/beams/common.types";
import type { Store } from "../../../../store/store";
import { GenericBeamView, type GenericBeamViewParams } from "./GenericBeamView";
import { HollowRectangleBeam } from "./HollowRectangleBeam";
import { HollowTubeBeam } from "./HollowTubeBeam";

const specialBeamMap = {
	[SHAPE_TYPES.HOLLOW_TUBE]: HollowTubeBeam,
	[SHAPE_TYPES.HOLLOW_RECTANGLE]: HollowRectangleBeam,
	[SHAPE_TYPES.HOLLOW_ROUNDED_RECTANGLE]: HollowRectangleBeam,
} as const;

/** Builds the beam class that draws the shape stored under `uid`: a special one for hollow shapes, the generic one otherwise */
export function createBeamView(uid: string, store: Store): GenericBeamView {
	const geometryData = store.geometry[uid];
	const BeamClass = specialBeamMap[geometryData?.type as keyof typeof specialBeamMap] ?? GenericBeamView;
	const params: GenericBeamViewParams = { uid, store };
	return new BeamClass(params as any);
}
