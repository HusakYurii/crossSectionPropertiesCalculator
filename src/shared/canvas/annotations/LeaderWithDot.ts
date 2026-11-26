import type { Point } from "@/shared/types/geometry";
import type { DrawableTarget } from "../core/DrawTargetsCollection.types";
import { CANVAS_FONT, LEADER_STYLE } from '../canvasStyle';
import { drawDot, drawLeader } from "../core/drawUtils";
import type { LeaderSide, LeaderStyle, LeaderVertical } from "../core/drawUtils.types";

const LEADER_DRAW_STYLE: LeaderStyle = {
	lineWidth: LEADER_STYLE.LINE_WIDTH,
	fontSize: CANVAS_FONT.LABEL_SIZE,
	diagonal: LEADER_STYLE.DIAGONAL,
	shelf: LEADER_STYLE.SHELF,
	labelGap: LEADER_STYLE.LABEL_GAP,
};

export type LeaderWithDotParams = {
	uid: string;
	/** point on the shape the dot sits on (world coords) */
	anchor: Point;
	label: string;
	side?: LeaderSide;
	/** put the shelf above ('top', default) or below ('bottom') the anchor */
	vertical?: LeaderVertical;
	color?: string;
};

/**
 * Static annotation: a dot on the shape with a leader line going out of it
 * and a label at the tail of the line.
 */
export class LeaderWithDot implements DrawableTarget {
	public readonly uid: string;

	private _anchor: Point;
	private _label: string;
	private _side: LeaderSide;
	private _vertical: LeaderVertical;
	private _color: string;

	constructor(params: LeaderWithDotParams) {
		this.uid = params.uid;
		this._anchor = params.anchor;
		this._label = params.label;
		this._side = params.side ?? 'right';
		this._vertical = params.vertical ?? 'top';
		this._color = params.color ?? 'black';
	}

	draw(props: { context: CanvasRenderingContext2D }): void {
		const { context } = props;

		const strokeStyle = context.strokeStyle;
		const fillStyle = context.fillStyle;
		const lineWidth = context.lineWidth;

		context.fillStyle = this._color;

		drawLeader(context, this._anchor, this._side, this._label, this._color, LEADER_DRAW_STYLE, this._vertical);
		drawDot(context, this._anchor, LEADER_STYLE.DOT_RADIUS);

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
	}
}
