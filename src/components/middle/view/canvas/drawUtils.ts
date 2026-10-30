import type { BoundingBox, Point } from "../../../../interfaces/common/types";
import { FONT_FAMILY } from "./constants/fontFamily";

/**
 * Sizes passed to the canvas are in world units, so a fixed value gets
 * bigger/smaller on screen as zoom changes. Deriving it from the current
 * transform's scale keeps a constant screen-pixel size.
 */
export function getScaledSize(context: CanvasRenderingContext2D, screenSize: number): number {
	const zoom = Math.abs(context.getTransform().a) || 1;
	return screenSize / zoom;
}

export type FontWeight = 'normal' | 'bold';

function getFont(context: CanvasRenderingContext2D, fontSize: number, fontWeight: FontWeight = 'normal'): string {
	return `${fontWeight} ${getScaledSize(context, fontSize)}px ${FONT_FAMILY}`;
}

/**
 * Pivot as fraction of the text's bounding box: x 0=left, 1=right; y 0=top, 1=bottom.
 * e.g. {x: 0.5, y: 1} anchors bottom-center at `at`, so the text sits above it.
 */
export type TextPivot = Point;

export const PIVOT = {
	CENTER: { x: 0.5, y: 0.5 } as TextPivot,
	BOTTOM_CENTER: { x: 0.5, y: 1 } as TextPivot,
	RIGHT_CENTER: { x: 1, y: 0.5 } as TextPivot,
};

/**
 * Canvas y-axis is flipped (scale(zoom, -zoom)) so text must be drawn with
 * an inverted scale to stay upright. Text is measured so `at` lands on the
 * given pivot of the text's bounding box, instead of fillText's default
 * baseline/left origin. `fontSize` is in screen pixels.
 */
export function drawUprightText(
	context: CanvasRenderingContext2D,
	text: string,
	at: Point,
	color: string,
	fontSize: number,
	pivot: TextPivot = PIVOT.CENTER,
	fontWeight: FontWeight = 'normal'
) {
	context.save();
	context.translate(at.x, at.y);
	context.scale(1, -1);
	context.font = getFont(context, fontSize, fontWeight);
	context.fillStyle = color;

	const metrics = context.measureText(text);
	const width = metrics.width;
	const ascent = metrics.actualBoundingBoxAscent;
	const descent = metrics.actualBoundingBoxDescent;
	const height = ascent + descent;

	const drawX = -pivot.x * width;
	const drawY = ascent - pivot.y * height;

	context.fillText(text, drawX, drawY);
	context.restore();
}

/**
 * Measures the world-space bounding box a call to drawUprightText would
 * occupy, without drawing it. Used to build hit boxes and label gaps.
 */
export function measureUprightTextBox(
	context: CanvasRenderingContext2D,
	text: string,
	at: Point,
	fontSize: number,
	pivot: TextPivot = PIVOT.CENTER,
	fontWeight: FontWeight = 'normal'
): BoundingBox {
	context.save();
	context.font = getFont(context, fontSize, fontWeight);

	const metrics = context.measureText(text);
	const width = metrics.width;
	const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

	context.restore();

	// text is drawn in a y-flipped local space (see drawUprightText), so its
	// top-left in world space is offset by -pivot.x*width on x but by
	// -(1 - pivot.y)*height on y (flip inverts which edge "top" is).
	return {
		x: at.x - pivot.x * width,
		y: at.y - (1 - pivot.y) * height,
		width,
		height,
	};
}

/** Filled triangle with its tip at `to`, pointing away from `from`. `screenSize` in px. Uses current fillStyle. */
export function drawArrowHead(
	context: CanvasRenderingContext2D,
	from: Point,
	to: Point,
	screenSize: number
) {
	const angle = Math.atan2(to.y - from.y, to.x - from.x);
	const size = getScaledSize(context, screenSize);

	context.beginPath();
	context.moveTo(to.x, to.y);
	context.lineTo(
		to.x - size * Math.cos(angle - Math.PI / 6),
		to.y - size * Math.sin(angle - Math.PI / 6)
	);
	context.lineTo(
		to.x - size * Math.cos(angle + Math.PI / 6),
		to.y - size * Math.sin(angle + Math.PI / 6)
	);
	context.closePath();
	context.fill();
}

/** Filled circle with a constant screen radius (px). Uses current fillStyle. */
export function drawDot(context: CanvasRenderingContext2D, at: Point, screenRadius: number) {
	context.beginPath();
	context.arc(at.x, at.y, getScaledSize(context, screenRadius), 0, Math.PI * 2);
	context.fill();
}

/**
 * Draws a small cross (local origin marker) centered at `at`.
 * `screenSize` is the arm length and `screenLineWidth` the stroke, both in px.
 */
export function drawOriginCross(
	context: CanvasRenderingContext2D,
	at: Point,
	color: string,
	screenSize: number,
	screenLineWidth: number
) {
	const strokeStyle = context.strokeStyle;
	const lineWidth = context.lineWidth;

	context.strokeStyle = color;
	context.lineWidth = getScaledSize(context, screenLineWidth);

	const size = getScaledSize(context, screenSize);

	context.beginPath();
	context.moveTo(at.x - size, at.y);
	context.lineTo(at.x + size, at.y);
	context.moveTo(at.x, at.y - size);
	context.lineTo(at.x, at.y + size);
	context.stroke();

	context.strokeStyle = strokeStyle;
	context.lineWidth = lineWidth;
}

export type LeaderSide = 'left' | 'right';
/** which way the shelf goes from the anchor (world y is up) */
export type LeaderVertical = 'top' | 'bottom';

/** All sizes are screen pixels, owned by the annotation that draws the leader. */
export type LeaderStyle = {
	lineWidth: number;
	fontSize: number;
	/** length of the 45deg segment going out of the anchor */
	diagonal: number;
	/** length of the horizontal segment the label sits on */
	shelf: number;
	/** gap between the shelf and the label */
	labelGap: number;
};

/**
 * Strokes a leader line: anchor -> 45deg diagonal out (up for 'top', down for
 * 'bottom') -> horizontal shelf, then writes `label` centered above the shelf
 * regardless of direction. Terminator (dot / arrow head)
 * at the anchor is left to the caller. Returns the elbow so the caller can orient it.
 */
export function drawLeader(
	context: CanvasRenderingContext2D,
	anchor: Point,
	side: LeaderSide,
	label: string,
	color: string,
	style: LeaderStyle,
	vertical: LeaderVertical = 'top'
): { elbow: Point } {
	const sign = side === 'right' ? 1 : -1;
	const vSign = vertical === 'top' ? 1 : -1;
	const diagonal = getScaledSize(context, style.diagonal);
	const shelf = getScaledSize(context, style.shelf);

	const elbow = { x: anchor.x + sign * diagonal, y: anchor.y + vSign * diagonal };
	const end = { x: elbow.x + sign * shelf, y: elbow.y };

	context.strokeStyle = color;
	context.lineWidth = getScaledSize(context, style.lineWidth);
	context.beginPath();
	context.moveTo(anchor.x, anchor.y);
	context.lineTo(elbow.x, elbow.y);
	context.lineTo(end.x, end.y);
	context.stroke();

	const labelAt = {
		x: (elbow.x + end.x) / 2,
		y: elbow.y + getScaledSize(context, style.labelGap),
	};
	drawUprightText(context, label, labelAt, color, style.fontSize, PIVOT.BOTTOM_CENTER);

	return { elbow };
}
