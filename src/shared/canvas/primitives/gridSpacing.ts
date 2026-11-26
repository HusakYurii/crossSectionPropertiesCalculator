import { GRID } from '../canvasInteraction';

export type GridSpacing = {
	/** distance between two grid lines, in world units (mm) */
	step: number;
	/** every this-many-th line is a major one */
	majorEvery: number;
};

/**
 * Grid spacing that follows the zoom: the smallest value of the 1-2-5 ladder (1, 2, 5, 10, 20, 50 ... mm, never below
 * GRID.MIN_STEP) whose cells are still at least GRID.MIN_CELL_PX CSS px wide. `cssPxPerUnit` is CSS px per world unit.
 * Major lines stay on round numbers: a step that starts with 2 gets one every 5 lines, the others every 10.
 */
export function getGridSpacing(cssPxPerUnit: number): GridSpacing {
	if (!Number.isFinite(cssPxPerUnit) || cssPxPerUnit <= 0) {
		return { step: GRID.MIN_STEP, majorEvery: 10 };
	}

	// wheel zoom (x1.02 / :1.02) does not come back to exactly 1, so a hair of tolerance keeps the default zoom at 10 mm
	const minCellPx = GRID.MIN_CELL_PX * (1 - 1e-6);

	// powers of ten are built by repeated multiplication from integers, so they stay exact (Math.pow(10, n) may not be)
	// the loop ends because the cell width grows with every decade; the cap only guards against a runaway
	let decade: number = GRID.MIN_STEP;
	for (let i = 0; i < 400; i++) {
		for (const mantissa of GRID.STEP_MANTISSAS) {
			const step = mantissa * decade;
			if (step * cssPxPerUnit >= minCellPx) {
				return { step, majorEvery: mantissa === 2 ? 5 : 10 };
			}
		}
		const next = decade * 10;
		if (!Number.isFinite(next)) {
			break;
		}
		decade = next;
	}

	return { step: decade, majorEvery: 10 };
}
