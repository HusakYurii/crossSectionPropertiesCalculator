import type { Point } from '../../../../interfaces/common/types.ts';
import { downloadCsv } from '../../../../fileLoader/downloadFiles.ts';
import { pointsToCsv } from './csvTextParser.ts';

// Export CSV file: the points are written in the format the importer reads, so a shape can make the round trip.

export const DEFAULT_CSV_FILE_NAME = 'custom-shape';

// characters the operating systems do not allow in a file name, and control characters
// eslint-disable-next-line no-control-regex
const INVALID_FILE_NAME_CHARS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;

/** the name without the invalid characters and the edge spaces, as it will be written (without .csv) */
export function sanitizeCsvFileName(fileName: string): string {
	return fileName
		.replace(INVALID_FILE_NAME_CHARS, '')
		.trim()
		// the user may type the extension themselves, so it is not doubled
		.replace(/\.csv$/i, '')
		// Windows drops trailing dots and spaces, so they are not left in the name
		.replace(/[. ]+$/, '');
}

/** a safe file name with one .csv at the end; an empty result falls back to the default name */
export function normalizeCsvFileName(fileName: string): string {
	return `${sanitizeCsvFileName(fileName) || DEFAULT_CSV_FILE_NAME}.csv`;
}

/** downloads the points as a CSV file with the given name */
export function exportCsvPoints(fileName: string, points: Point[]): void {
	downloadCsv(normalizeCsvFileName(fileName), pointsToCsv(points));
}
