import type { Point } from '@/shared/types/geometry';
import { filesDownloader } from '@/shared/io/FilesDownloader';
import { normalizeFileName } from '@/shared/io/fileNameUtils';
import { pointsToCsv } from './csvTextParser';

// Export CSV file: the points are written in the format the importer reads, so a shape can make the round trip.

export const DEFAULT_CSV_FILE_NAME = 'custom-shape';

/** downloads the points as a CSV file with the given name */
export function exportCsvPoints(fileName: string, points: Point[]): void {
	filesDownloader.downloadCsv(normalizeFileName(fileName, 'csv', DEFAULT_CSV_FILE_NAME), pointsToCsv(points));
}
