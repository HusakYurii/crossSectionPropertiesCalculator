import type { Point } from "../../../../../interfaces/common/types";
import type { DrawableTarget } from "../DrawTargetsCollection";
import { drawArrowHead, drawLeader, type LeaderSide, type LeaderStyle, type LeaderVertical } from "../drawUtils";

const ARROW_HEAD_SIZE = 9.45;
const LEADER_STYLE: LeaderStyle = {
	lineWidth: 1.89,
	fontSize: 22,
	diagonal: 30,
	shelf: 50,
	labelGap: 4,
};

export type LeaderWithArrowParams = {
	uid: string;
	/** point on the shape the arrow tip touches (world coords) */
	anchor: Point;
	label: string;
	side?: LeaderSide;
	/** put the shelf above ('top', default) or below ('bottom') the anchor */
	vertical?: LeaderVertical;
	color?: string;
};

/**
 * Static annotation: a leader line ending in an arrow head that points at
 * the anchor, with a label at the tail of the line (e.g. for radii).
 */
export class LeaderWithArrow implements DrawableTarget {
	public readonly uid: string;

	private _anchor: Point;
	private _label: string;
	private _side: LeaderSide;
	private _vertical: LeaderVertical;
	private _color: string;

	constructor(params: LeaderWithArrowParams) {
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

		const { elbow } = drawLeader(context, this._anchor, this._side, this._label, this._color, LEADER_STYLE, this._vertical);
		drawArrowHead(context, elbow, this._anchor, ARROW_HEAD_SIZE);

		context.strokeStyle = strokeStyle;
		context.fillStyle = fillStyle;
		context.lineWidth = lineWidth;
	}
}
