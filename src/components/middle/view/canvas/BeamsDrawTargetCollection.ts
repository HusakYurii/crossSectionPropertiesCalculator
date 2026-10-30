import type { GenericBeamView } from "../beams";
import { DrawTargetsCollection } from "./DrawTargetsCollection";


export class BeamsDrawTargetCollection extends DrawTargetsCollection<GenericBeamView> {

	override draw(hits: boolean[], ids: {
		hoveredShapeID: string;
		selectedShapeID: string;
	}) {
		this._items.forEach((item, i) => {
			item.draw({
				context: this._props.context,
				isHovered: Boolean(hits[i]) || ids.hoveredShapeID === item.uid,
				isSelected: ids.selectedShapeID === item.uid,
			});
			item.showDebug && item.drawDebug(this._props);
		});
	}
}
