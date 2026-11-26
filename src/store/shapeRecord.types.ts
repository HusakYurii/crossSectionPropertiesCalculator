import type { Geometry } from '@/shared/shapes/types/common.types';
import type { Point } from '@/shared/types/geometry';
import type { CrossSectionProperties } from '@/shared/types/sectionProperties';
import type { Triangle } from '@/shared/types/mesh';
import type { DimensionLabelOffsetKey } from '@/shared/types/dimensionLabels';
import type { GeometryDataExtra } from './store.types';

/** Everything that makes up one shape: the 5 store groups and the 2 session groups. History and the clipboard both use it */
export type ShapeRecord = {
	geometry: Geometry;
	extra: GeometryDataExtra;
	properties: CrossSectionProperties;
	polygon: Point[];
	mesh?: Triangle[];
	showRotation?: true;
	labelOffsets?: Partial<Record<DimensionLabelOffsetKey, number>>;
};
