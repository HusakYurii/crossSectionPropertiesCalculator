import { toast } from 'vue3-toastify';
import type { Point } from '../../../../interfaces/common/types.ts';
import { fileUploader } from '../../../../services/singletons/FileUploader.ts';
import { convertCSVToPoints } from './csvTextParser.ts';

// Import CSV file: the points in the file replace the ones on the canvas. Rows are x,y pairs, like the
// files the shape forms export. Values are rounded to 0.001 mm, as the point fields keep them, and a
// last row that repeats the first one (a closed polygon) is dropped because a shape closes itself.

/** asks the user for a CSV file and hands over its points; shows a toast instead when the file is not usable */
export function pickCsvPoints(onPoints: (points: Point[]) => void) {
	fileUploader.uploadCsv( async (file) => {

		if (!file) {
			toast.error("No file was attached, try again")
			return;
		}

		const result = convertCSVToPoints(await file.text(), { decimals: 3, dropClosingPoint: true });
		if (!result.ok) {
			// nothing is replaced when the file is wrong, so the drawing the user has is never half lost
			toast.error(result.error)
			return;
		}

		onPoints(result.points);
	});
}
