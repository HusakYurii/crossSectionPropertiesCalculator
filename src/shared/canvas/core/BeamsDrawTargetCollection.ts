import type { GenericBeamView } from "../beams";
import { DrawTargetsCollection } from "./DrawTargetsCollection";


export class BeamsDrawTargetCollection extends DrawTargetsCollection<GenericBeamView> {

	/**
	 * Positive shapes are hatched, each with the angle it was given when it was created.
	 * Shapes are drawn in list order, so the last one in the list is on top.
	 */
	override draw(hits: boolean[], ids: {
		hoveredShapeID: string;
		selectedShapeID: string;
	}, options: { showHatching?: boolean } = {}) {
		this._items.forEach((item, i) => {
			item.draw({
				context: this._props.context,
				isHovered: Boolean(hits[i]) || ids.hoveredShapeID === item.uid,
				isSelected: ids.selectedShapeID === item.uid,
				showHatching: options.showHatching ?? true,
			});
			item.showDebug && item.drawDebug(this._props);
		});
	}
}
