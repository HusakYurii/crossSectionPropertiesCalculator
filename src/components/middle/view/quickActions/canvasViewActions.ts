import type { CanvasScene } from '../canvas/CanvasScene';

export type CanvasViewActions = {
	center: () => void;
	resetZoom: () => void;
	fitToScreen: () => void;
};

/** the view actions of a canvas: center and reset zoom come from its scene, fit to screen is the canvas's own */
export function createCanvasViewActions(getScene: () => CanvasScene | undefined, fitToScreen: () => void): CanvasViewActions {
	// the scene is read lazily because both canvases create it only once mounted
	return {
		center: () => getScene()?.centerView(),
		resetZoom: () => getScene()?.resetZoom(),
		fitToScreen,
	};
}
