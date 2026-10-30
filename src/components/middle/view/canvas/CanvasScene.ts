import type { Service, Sizes } from "../../../../interfaces/common/types";
import { CanvasTransformService } from "../services/CanvasTransformService";
import { InputService } from "../services/InputService";
import { ResizeService } from "../services/ResizeService";
import { Canvas, type CanvasSize } from "./Canvas";

type CanvasSceneProps = {
	canvasEl: HTMLCanvasElement;
	/** the element whose size the canvas follows */
	wrapper: HTMLElement;
	minSize: Sizes;
	minZoom: number;
	maxZoom: number;
	startZoom?: number;
	/** paints one frame; the canvas is already cleared and the view (pan / zoom) is applied */
	draw: (context: CanvasRenderingContext2D) => void;
	/** called after the canvas took its new size, before the next frame is painted */
	onResize?: (size: CanvasSize) => void;
};

/**
 * The part every interactive canvas has in common: the Canvas, mouse / wheel input, pan and zoom,
 * following the size of its wrapper, and a render loop that only paints when something asked for it.
 * A canvas supplies what to draw and adds its own interaction services on top.
 */
export class CanvasScene implements Service {
	readonly canvas: Canvas;
	readonly inputService: InputService;
	readonly transformService: CanvasTransformService;

	private _resizeService: ResizeService;
	private _extraServices: Service[] = [];
	private _draw: (context: CanvasRenderingContext2D) => void;
	private _onResize?: (size: CanvasSize) => void;
	private _startZoom: number;
	private _shouldUpdate = false;
	private _frameId = 0;
	private _active = false;

	constructor(props: CanvasSceneProps) {
		this._draw = props.draw;
		this._onResize = props.onResize;

		this.canvas = new Canvas(props.canvasEl);
		this.inputService = new InputService({ canvas: props.canvasEl });

		this.transformService = new CanvasTransformService({
			canvas: props.canvasEl,
			inputService: this.inputService,
			minZoom: props.minZoom,
			maxZoom: props.maxZoom,
			getDisplaySize: () => {
				const { displayWidth, displayHeight } = this.canvas.canvasSize;
				return { width: displayWidth, height: displayHeight };
			},
			onViewChange: this.requestRedraw,
		});
		// the zoom the canvas opens with is also the one "reset zoom" goes back to
		this._startZoom = props.startZoom ?? this.transformService.transforms.zoom;
		this.transformService.transforms.zoom = this._startZoom;

		this._resizeService = new ResizeService({
			wrapper: props.wrapper,
			minSize: props.minSize,
			onResize: this._handleResize,
		});
	}

	get context(): CanvasRenderingContext2D {
		return this.canvas.context;
	}

	/**
	 * Puts the view back so world (0, 0) is in the middle of the canvas, keeping the current zoom. The
	 * mapping is the one the whole canvas uses: pan 0 is the canvas center, so the origin is centered.
	 */
	centerView = (): void => {
		const view = this.transformService.transforms;
		view.panX = 0;
		view.panY = 0;
		this.requestRedraw();
	};

	/**
	 * Goes back to the zoom the canvas started with. The point that is in the middle of the canvas stays
	 * there, so the view zooms in place and does not jump to another part of the drawing.
	 */
	resetZoom = (): void => {
		const view = this.transformService.transforms;
		const ratio = this._startZoom / view.zoom;
		// pan is the screen offset of the world origin from the canvas center; scaling it by the same ratio as the zoom
		// keeps whatever is at the center of the canvas at the center
		view.panX *= ratio;
		view.panY *= ratio;
		view.zoom = this._startZoom;
		this.requestRedraw();
	};

	/** asks for a repaint on the next frame; any number of calls before it cost one paint */
	requestRedraw = (): void => {
		this._shouldUpdate = true;
	};

	/**
	 * Adds an interaction service. It is started after pan / zoom and stopped before it, so
	 * whatever cursor it sets on mouse move wins over the one pan / zoom resets.
	 */
	addService(service: Service): void {
		this._extraServices.push(service);
		if (this._active) {
			service.initialize();
		}
	}

	initialize(): void {
		if (this._active) {
			return;
		}

		this._resizeService.initialize();
		this.inputService.initialize();
		this.transformService.initialize();
		this._extraServices.forEach((service) => service.initialize());
		this._active = true;
		this._tick();
	}

	deactivate(): void {
		if (!this._active) {
			return;
		}

		cancelAnimationFrame(this._frameId);
		[...this._extraServices].reverse().forEach((service) => service.deactivate());
		this.transformService.deactivate();
		this.inputService.deactivate();
		this._resizeService.deactivate();
		this._active = false;
	}

	private _handleResize = (size: CanvasSize): void => {
		this.canvas.resize(size);
		this._onResize?.(size);
		this.requestRedraw();
	};

	private _tick(): void {
		this._frameId = requestAnimationFrame(() => {
			if (this._shouldUpdate) {
				this._shouldUpdate = false;
				this.canvas.clearAndApplyTransforms(this.transformService.transforms);
				this._draw(this.canvas.context);
			}
			this._tick();
		});
	}
}
