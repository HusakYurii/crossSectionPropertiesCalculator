import type { Point } from '@/shared/types/geometry';

interface Identifiable {
	uid: string;
}

interface Drawable {
	showDebug: boolean;
	draw: (props: { context: CanvasRenderingContext2D, isHovered?: boolean, isSelected?: boolean; }) => void;
	drawDebug: (props: { context: CanvasRenderingContext2D }) => void;
}

interface Detectable {
	contains: (point: Point) => boolean;
}

export type DrawTarget = Identifiable & Drawable & Detectable;

export interface DrawableTarget {
	uid: string;
	draw: (props: { context: CanvasRenderingContext2D }) => void;
}
