import type { Point } from '../../../../interfaces/common/types.ts';
import { filesDownloader } from '../../../../services/singletons/FilesDownloader.ts';
import { normalizeFileName } from '../../../../utils/fileNameUtils.ts';
import { pointsToCsv } from './csvTextParser.ts';

// Export CSV file: the points are written in the format the importer reads, so a shape can make the round trip.

export const DEFAULT_CSV_FILE_NAME = 'custom-shape';

/** downloads the points as a CSV file with the given name */
export function exportCsvPoints(fileName: string, points: Point[]): void {
	filesDownloader.downloadCsv(normalizeFileName(fileName, 'csv', DEFAULT_CSV_FILE_NAME), pointsToCsv(points));
}
