import type { CompositePart } from '@/solvers';
import type { Store } from './store';

type CompositeSource = Pick<Store, 'geometry' | 'geometryExtra' | 'crossSectionProperties' | 'crossSectionPolygon'>;

/** shapes with all four records, in store (left panel) order: the same filter solve(store) used */
export const getCompositeParts = (s: CompositeSource): CompositePart[] => Object.keys(s.geometry).flatMap((uid) => {
	const properties = s.crossSectionProperties[uid];
	const position = s.geometryExtra[uid]?.position;
	const polygon = s.crossSectionPolygon[uid];
	if (!properties || !position || !polygon) {
		return [];
	}
	return [{ geometry: s.geometry[uid], properties, position, polygon }];
});
