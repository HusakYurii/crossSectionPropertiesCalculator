import type { Service } from "../../../../interfaces/common/types";

type WheelCallback = (event: WheelEvent) => void;
type MouseCallback = (event: MouseEvent) => void;
type KeyboardCallback = (event: KeyboardEvent) => void;
type VoidCallback = () => void;

type InputServiceProps = {
	canvas: HTMLCanvasElement;
};

export class InputService implements Service {
	private _canvas: HTMLCanvasElement;
	private _wheelCallbacks = new Set<WheelCallback>();
	private _mouseDownCallbacks = new Set<MouseCallback>();
	private _mouseMoveCallbacks = new Set<MouseCallback>();
	private _mouseUpCallbacks = new Set<MouseCallback>();
	private _mouseLeaveCallbacks = new Set<VoidCallback>();
	private _contextMenuCallbacks = new Set<MouseCallback>();
	private _keyDownCallbacks = new Set<KeyboardCallback>();
	private _keyUpCallbacks = new Set<KeyboardCallback>();
	private _windowBlurCallbacks = new Set<VoidCallback>();
	private _active = false;

	constructor(props: InputServiceProps) {
		this._canvas = props.canvas;
	}

	onWheel(callback: WheelCallback): () => void {
		return this._subscribe(this._wheelCallbacks, callback);
	}

	onMouseDown(callback: MouseCallback): () => void {
		return this._subscribe(this._mouseDownCallbacks, callback);
	}

	onMouseMove(callback: MouseCallback): () => void {
		return this._subscribe(this._mouseMoveCallbacks, callback);
	}

	onMouseUp(callback: MouseCallback): () => void {
		return this._subscribe(this._mouseUpCallbacks, callback);
	}

	onMouseLeave(callback: VoidCallback): () => void {
		return this._subscribe(this._mouseLeaveCallbacks, callback);
	}

	onContextMenu(callback: MouseCallback): () => void {
		return this._subscribe(this._contextMenuCallbacks, callback);
	}

	onKeyDown(callback: KeyboardCallback): () => void {
		return this._subscribe(this._keyDownCallbacks, callback);
	}

	onKeyUp(callback: KeyboardCallback): () => void {
		return this._subscribe(this._keyUpCallbacks, callback);
	}

	onWindowBlur(callback: VoidCallback): () => void {
		return this._subscribe(this._windowBlurCallbacks, callback);
	}

	initialize(): void {
		if (this._active) {
			return;
		}

		this._canvas.addEventListener('wheel', this._handleWheel, { passive: false });
		this._canvas.addEventListener('mousedown', this._handleMouseDown);
		this._canvas.addEventListener('mousemove', this._handleMouseMove);
		this._canvas.addEventListener('mouseup', this._handleMouseUp);
		this._canvas.addEventListener('mouseleave', this._handleMouseLeave);
		this._canvas.addEventListener('contextmenu', this._handleContextMenu);
		window.addEventListener('keydown', this._handleKeyDown);
		window.addEventListener('keyup', this._handleKeyUp);
		window.addEventListener('blur', this._handleWindowBlur);
		this._active = true;
	}

	deactivate(): void {
		if (!this._active) {
			return;
		}

		this._canvas.removeEventListener('wheel', this._handleWheel);
		this._canvas.removeEventListener('mousedown', this._handleMouseDown);
		this._canvas.removeEventListener('mousemove', this._handleMouseMove);
		this._canvas.removeEventListener('mouseup', this._handleMouseUp);
		this._canvas.removeEventListener('mouseleave', this._handleMouseLeave);
		this._canvas.removeEventListener('contextmenu', this._handleContextMenu);
		window.removeEventListener('keydown', this._handleKeyDown);
		window.removeEventListener('keyup', this._handleKeyUp);
		window.removeEventListener('blur', this._handleWindowBlur);
		this._active = false;
	}

	private _subscribe<T>(callbacks: Set<T>, callback: T): () => void {
		callbacks.add(callback);
		return () => callbacks.delete(callback);
	}

	private _dispatch(callbacks: Set<VoidCallback>): void;
	private _dispatch<T>(callbacks: Set<(event: T) => void>, event: T): void;
	private _dispatch<T>(callbacks: Set<(event: T) => void> | Set<VoidCallback>, event?: T): void {
		for (const callback of callbacks as Set<(event?: T) => void>) {
			callback(event);
		}
	}

	private _handleWheel = (event: WheelEvent): void => this._dispatch(this._wheelCallbacks, event);
	private _handleMouseDown = (event: MouseEvent): void => this._dispatch(this._mouseDownCallbacks, event);
	private _handleMouseMove = (event: MouseEvent): void => this._dispatch(this._mouseMoveCallbacks, event);
	private _handleMouseUp = (event: MouseEvent): void => this._dispatch(this._mouseUpCallbacks, event);
	private _handleMouseLeave = (): void => this._dispatch(this._mouseLeaveCallbacks);
	private _handleContextMenu = (event: MouseEvent): void => this._dispatch(this._contextMenuCallbacks, event);
	private _handleKeyDown = (event: KeyboardEvent): void => this._dispatch(this._keyDownCallbacks, event);
	private _handleKeyUp = (event: KeyboardEvent): void => this._dispatch(this._keyUpCallbacks, event);
	private _handleWindowBlur = (): void => this._dispatch(this._windowBlurCallbacks);
}
