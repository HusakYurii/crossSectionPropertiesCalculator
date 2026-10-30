import type { Point } from "../../../../../interfaces/common/types";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { drawDot, drawLeader, type LeaderSide, type LeaderStyle, type LeaderVertical } from "../drawUtils";

const DOT_RADIUS = 5;
const LEADER_STYLE: LeaderStyle = {
	lineWidth: 1.89,
	fontSize: 22,
	diagonal: 30,
	shelf: 50,
	labelGap: 4,
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

		drawLeader(context, this._anchor, this._side, this._label, this._color, LEADER_STYLE, this._vertical);
		drawDot(context, this._anchor, DOT_RADIUS);

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
	}
}
