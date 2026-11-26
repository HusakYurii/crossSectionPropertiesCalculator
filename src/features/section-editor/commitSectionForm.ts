import type { Triangle } from '@/shared/types/mesh';
import { addGeometryData, updateGeometryData, getUID, addCrossSectionProperties, updateCrossSectionProperties, updateCrossSectionPolygon, addCrossSectionPolygon, updateGeometryExtraData, addGeometryExtraData, setCrossSectionMesh, removeCrossSectionMesh } from '@/store/store';
import { setShowRotation } from '@/store/appSessionState';
import { history } from '@/store/history';
import type { SectionFormResult } from './sectionForm.types';

/** an empty or missing mesh means there is nothing to keep, so an old one must not stay behind */
function saveMesh(uid: string, mesh: Triangle[] | undefined) {
	if (mesh && mesh.length > 0) {
		setCrossSectionMesh({ uid, data: mesh });
	} else {
		removeCrossSectionMesh(uid);
	}
}

/** Writes a form result as a new shape (uid null) or over an existing one, then records one undo step. Returns the uid */
export function commitSectionForm(args: { uid: string | null; name: string; result: SectionFormResult; showRotation: boolean }): string {
	const { name, result, showRotation } = args;
	const uid = args.uid ?? getUID();

	if (args.uid) {
		updateGeometryExtraData({ uid, data: { name } });
		updateGeometryData({ uid, data: result.geometry });
		updateCrossSectionPolygon({ uid, data: result.crossSectionPolygon });
		updateCrossSectionProperties({ uid, data: result.crossSectionProperties });
		saveMesh(uid, result.crossSectionMesh);
	} else {
		addGeometryExtraData({ uid, data: { name, position: { x: 0, y: 0 } } });
		addGeometryData({ uid, data: result.geometry });
		addCrossSectionPolygon({ uid, data: result.crossSectionPolygon });
		addCrossSectionProperties({ uid, data: result.crossSectionProperties });
		saveMesh(uid, result.crossSectionMesh);
	}

	setShowRotation(uid, showRotation);
	history.commit();
	return uid;
}
