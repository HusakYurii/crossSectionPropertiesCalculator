import type { Point } from '@/shared/types/geometry';
import type { DrawTarget } from '../core/DrawTargetsCollection.types';
import { getCssPxRatio } from "../core/drawUtils";
import { getGridSpacing } from "./gridSpacing";
import { CANVAS_FONT, SCALE_BAR_STYLE } from '../canvasStyle';

/**
 * Scale bar in the bottom-right corner, exactly one grid cell long and labelled with the cell size.
 * It is drawn in screen space (canvas px) instead of world space, so it keeps its place and the label stays upright.
 */
export class ScaleBar implements DrawTarget {
	static uid = 'scaleBar';

	public uid = ScaleBar.uid;

	public showDebug: boolean = false;

	contains(_point: Point) {
		return false;
	}

	draw(props: { context: CanvasRenderingContext2D }) {
		const { context } = props;
		const { canvas } = context;

		const ratio = getCssPxRatio(canvas);
		const scale = Math.abs(context.getTransform().a);
		const cssPxPerUnit = scale / ratio;
		// getGridSpacing falls back for bad input, but the bar length divides nothing and still needs a usable scale
		if (!Number.isFinite(scale) || scale <= 0) {
			return;
		}

		// the same spacing the grid uses, from the same transform
		const { step } = getGridSpacing(cssPxPerUnit);
		// canvas px, never rounded: this is the distance between two grid lines on screen
		const length = step * scale;

		const { MARGIN, TICK_HEIGHT, LINE_WIDTH, COLOR, FONT_SIZE, LABEL_GAP } = SCALE_BAR_STYLE;
		const canvasWidth = canvas.width;
		const canvasHeight = canvas.height;

		if (length > canvasWidth - 2 * MARGIN) {
			return;
		}

		// only the anchor may be rounded, the length never is
		const x1 = Math.round(canvasWidth - MARGIN);
		const x0 = x1 - length;
		const y = Math.round(canvasHeight - MARGIN);

		context.save();
		context.setTransform(1, 0, 0, 1, 0, 0);

		context.strokeStyle = COLOR;
		context.lineWidth = LINE_WIDTH;
		context.lineCap = 'butt';

		// the end ticks are centered on the bar's exact ends, like grid lines are centered on their world value
		context.beginPath();
		context.moveTo(x0, y);
		context.lineTo(x1, y);
		context.moveTo(x0, y - TICK_HEIGHT / 2);
		context.lineTo(x0, y + TICK_HEIGHT / 2);
		context.moveTo(x1, y - TICK_HEIGHT / 2);
		context.lineTo(x1, y + TICK_HEIGHT / 2);
		context.stroke();

		// the label is wider than a short bar, so it is centered on the bar and only held back by the margins
		const label = `${step} mm`;
		context.font = `${FONT_SIZE}px ${CANVAS_FONT.FAMILY}`;
		context.fillStyle = COLOR;
		context.textBaseline = 'bottom';
		context.textAlign = 'left';
		const labelWidth = context.measureText(label).width;
		const labelX = Math.max(MARGIN, Math.min((x0 + x1) / 2 - labelWidth / 2, canvasWidth - MARGIN - labelWidth));
		context.fillText(label, labelX, y - TICK_HEIGHT / 2 - LABEL_GAP);

		context.restore();
	}

	drawDebug(_props: { context: CanvasRenderingContext2D }): void {
	}
}
