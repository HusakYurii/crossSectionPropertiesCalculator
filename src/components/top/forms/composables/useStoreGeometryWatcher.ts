import { reactive, watch } from "vue";
import { store } from "../../../../store/store";
import type { Geometry } from "../../../../interfaces/beams/common.types";

export type WatchStoreGeometryProps = { selectedShapeUID: string | null };

export const useStoreGeometryWatcher = <T extends Geometry>(props: WatchStoreGeometryProps, getDefault: () => T) => {

	const geometry = reactive<T>(getDefault());

	watch(
		() => props.selectedShapeUID,
		(uid) => {
			const existing = uid ? store.geometry[Number(uid)] : null;
			if (existing) {
				// deep copy: shapes with nested data (custom shape points) must not be edited in the store before Save
				Object.assign(geometry, JSON.parse(JSON.stringify(existing)) as T)
			}
		},
		{ immediate: true },
	);

	return {
		geometry
	}

}