import type { BoundingBox } from "../../../../interfaces/common/types";
import type { GenericBeamView } from "../beams";
import { DrawTargetsCollection } from "./DrawTargetsCollection";


export class BeamsDrawTargetCollection extends DrawTargetsCollection<GenericBeamView> {

	/** Union of the boxes of all beams (negative ones too, they are drawn), or null when there are none. */
	getBoundingBox(): BoundingBox | null {
		if (this._items.length === 0) {
			return null;
		}

		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;

		for (const { boundingBox } of this._items) {
			minX = Math.min(minX, boundingBox.x);
			minY = Math.min(minY, boundingBox.y);
			maxX = Math.max(maxX, boundingBox.x + boundingBox.width);
			maxY = Math.max(maxY, boundingBox.y + boundingBox.height);
		}

		return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
	}

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
