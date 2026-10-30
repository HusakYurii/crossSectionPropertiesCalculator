import type { Sizes, Service } from '../../../../interfaces/common/types';
import type { CanvasSize } from '../canvas/Canvas';

export type ResizeCallback = (size: CanvasSize) => void;

type ResizeServiceProps = {
	wrapper: HTMLElement;
	minSize: Sizes;
	onResize: ResizeCallback;
};

export function computeCanvasSize(
	wrapperWidth: number,
	wrapperHeight: number,
	minSize: Sizes,
	devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2),
): CanvasSize {
	const displayWidth = wrapperWidth;
	const displayHeight = wrapperHeight;

	const scale = Math.max(
		1,
		minSize.width / displayWidth,
		minSize.height / displayHeight,
		devicePixelRatio,
	);

	const pixelWidth = Math.round(displayWidth * scale);
	const pixelHeight = Math.round(displayHeight * scale);
	const dpr = pixelWidth / displayWidth;

	return {
		displayWidth,
		displayHeight,
		pixelWidth,
		pixelHeight,
		dpr,
	};
}

export class ResizeService implements Service {
	private _wrapper: HTMLElement;
	private _minSize: Sizes;
	private _onResize: ResizeCallback;
	private _observer: ResizeObserver | null = null;
	private _size: CanvasSize = {
		displayWidth: 0,
		displayHeight: 0,
		pixelWidth: 0,
		pixelHeight: 0,
		dpr: 1,
	};

	constructor(props: ResizeServiceProps) {
		this._wrapper = props.wrapper;
		this._minSize = props.minSize;
		this._onResize = props.onResize;
	}

	get canvasSize(): CanvasSize {
		return this._size;
	}

	initialize(): void {
		if (this._observer) {
			return;
		}

		this._observer = new ResizeObserver((entries) => this._handleResize(entries));
		this._observer.observe(this._wrapper);
	}

	deactivate(): void {
		this._observer?.disconnect();
		this._observer = null;
	}

	private _handleResize([wrapperData]: ResizeObserverEntry[]): void {
		const [borderBoxSize] = wrapperData.borderBoxSize;
		this._size = computeCanvasSize(
			borderBoxSize.inlineSize,
			borderBoxSize.blockSize,
			this._minSize,
		);
		this._onResize(this._size);
	}
}
