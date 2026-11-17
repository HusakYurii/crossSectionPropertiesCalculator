import type { BoundingBox, Point } from "../../../../interfaces/common/types";
import { BEAM_STYLE } from "../../../../constants/canvasStyle";
import { cssPxToWorld, getScaledSize } from "./drawUtils";

export interface CrossHatchStyle {
	color: string;
	/** fewest hatch lines across a shape */
	minLines: number;
	/** lines = density * sqrt(shape size in world units) */
	density: number;
	/** the densest the hatch gets when a shape is tiny on screen, in CSS px */
	minSpacing: number;
	/** in screen px */
	lineWidth: number;
}

export interface CrossHatchProps {
	/** outline the hatch is clipped to */
	path: Path2D;
	fillRule: CanvasFillRule;
	/** world box that has to be covered, the lines are cut to the path by the clip */
	bounds: BoundingBox;
	/** the lines are stepped from this point, so the hatch moves with the shape */
	anchor: Point;
	/** width of the shape across the 45deg lines, in world units */
	extent: number;
}

/** 45deg hatching clipped to a path. It knows nothing about what the path belongs to. */
export class CrossHatch {

	private _style: CrossHatchStyle;

	constructor(style: Partial<CrossHatchStyle> = {}) {
		this._style = {
			color: style.color ?? BEAM_STYLE.NEGATIVE_HATCH.COLOR,
			minLines: style.minLines ?? BEAM_STYLE.NEGATIVE_HATCH.MIN_LINES,
			density: style.density ?? BEAM_STYLE.NEGATIVE_HATCH.DENSITY,
			minSpacing: style.minSpacing ?? BEAM_STYLE.NEGATIVE_HATCH.MIN_SPACING,
			lineWidth: style.lineWidth ?? BEAM_STYLE.NEGATIVE_HATCH.LINE_WIDTH,
		};
	}

	draw(context: CanvasRenderingContext2D, props: CrossHatchProps): void {
		const { path, fillRule, bounds, anchor, extent } = props;

		// the line count depends only on the shape's size (not zoom), so the hatch zooms with the shape
		// like a drawn texture. It grows with sqrt(size): big shapes get more lines but a slightly coarser hatch.
		// The screen floor only kicks in when the shape is a few px on screen, to avoid moire.
		const lines = Math.max(
			this._style.minLines,
			this._style.density * Math.sqrt(Math.max(0, extent)),
		);
		const spacing = Math.max(
			cssPxToWorld(context, this._style.minSpacing),
			extent / lines,
		);

		// one spacing of padding, so the lines run past the edges of the shape
		const box = this._intersectWithVisibleArea(context, {
			x: bounds.x - spacing,
			y: bounds.y - spacing,
			width: bounds.width + 2 * spacing,
			height: bounds.height + 2 * spacing,
		});
		if (!box) {
			return;
		}

		context.save();
		context.clip(path, fillRule);

		context.strokeStyle = this._style.color;
		context.lineWidth = getScaledSize(context, this._style.lineWidth);

		// lines are y = x + c, `spacing` is measured across them, so c steps by spacing * sqrt(2)
		const step = spacing * Math.SQRT2;
		const c0 = anchor.y - anchor.x;
		const left = box.x;
		const right = box.x + box.width;
		const cMin = box.y - right;
		const cMax = box.y + box.height - left;

		context.beginPath();
		for (let c = c0 + Math.ceil((cMin - c0) / step) * step; c <= cMax; c += step) {
			context.moveTo(left, left + c);
			context.lineTo(right, right + c);
		}
		context.stroke();

		context.restore();
	}

	/** Part of the box inside the canvas, in world units. Bounds the number of lines at high zoom. */
	private _intersectWithVisibleArea(context: CanvasRenderingContext2D, box: BoundingBox): BoundingBox | null {
		const inverse = context.getTransform().inverse();
		const { width, height } = context.canvas;
		const corners = [
			inverse.transformPoint(new DOMPoint(0, 0)),
			inverse.transformPoint(new DOMPoint(width, 0)),
			inverse.transformPoint(new DOMPoint(width, height)),
			inverse.transformPoint(new DOMPoint(0, height)),
		];

		const minX = Math.max(box.x, Math.min(...corners.map(p => p.x)));
		const maxX = Math.min(box.x + box.width, Math.max(...corners.map(p => p.x)));
		const minY = Math.max(box.y, Math.min(...corners.map(p => p.y)));
		const maxY = Math.min(box.y + box.height, Math.max(...corners.map(p => p.y)));

		if (maxX <= minX || maxY <= minY) {
			return null;
		}
		return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
	}
}
