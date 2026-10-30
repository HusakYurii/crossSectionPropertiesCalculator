import type { Point } from "../../../../interfaces/common/types";

const HEADER = 'x,y';
const LINE_BREAK = '\r\n';

/**
 * Points as CSV text: a header line, then one `x,y` line per point. A polygon that is closed by repeating
 * its first point at the end is written as it is. Numbers are written with a dot as the decimal separator
 * whatever the browser language is, so the file reads the same everywhere.
 */
export function pointsToCsv(points: Point[]): string {
	const lines = points.map(({ x, y }) => `${formatNumber(x)},${formatNumber(y)}`);
	return [HEADER, ...lines].join(LINE_BREAK) + LINE_BREAK;
}

function formatNumber(value: number): string {
	// `|| 0` turns -0 into 0, and a rounded value keeps float noise like 7.600000000000001 out of the file
	return String(Math.round(value * 1e6) / 1e6 || 0);
}

/*

// TEST CODE
// The polygon the solver works with, in the shape's own frame (rotation applied), as x,y rows.
// Written on request, not from a watch: the polygon changes on every keystroke in the fields.
function exportCsv() {
	if (crossSectionPolygon.value.length === 0) {
		return;
	}
	downloadSCVFile('i-section.csv', pointsToCsv(crossSectionPolygon.value));
}

function openCsvInfo() {
	// TODO: explain what the file contains and how to import it into a custom shape
}

<ButtonField label="Outline points" button-text="Export CSV file" info-label="CSV export info"
			@click="exportCsv" @info="openCsvInfo" />


*/
export type CsvPointsOptions = {
	/** round every value to a whole number, like the points the custom shape editor works with */
	round?: boolean;
	/** drop the last point when it repeats the first one: a file written from a closed polygon has it, a shape closes itself */
	dropClosingPoint?: boolean;
	/** the file is refused above this many points, so a wrong file cannot freeze the page */
	maxPoints?: number;
};

export type CsvPointsResult =
	| { ok: true; points: Point[] }
	| { ok: false; error: string };

const DEFAULT_MAX_POINTS = 10000;
const NUMBER_PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i;

/**
 * Reads points back from CSV text, the format convertCSVToPoints writes and the common spreadsheet variants of it:
 * - one `x,y` pair per row, with or without a header row (a first row that is not numbers is the header)
 * - a comma, semicolon or tab between the values; with a semicolon the decimal separator may be a comma
 * - blank lines, quotes around values, a byte order mark and any kind of line break are fine
 * Anything else is refused with a message that names the line, so nothing is imported half way.
 */
export function convertCSVToPoints(text: string, options: CsvPointsOptions = {}): CsvPointsResult {
	const maxPoints = options.maxPoints ?? DEFAULT_MAX_POINTS;

	const rows = text
		.replace(/^﻿/, '')
		.split(/\r\n|\n|\r/)
		.map((content, index) => ({ line: index + 1, content: content.trim() }))
		.filter((row) => row.content !== '');


	if (rows.length === 0) {
		return createFailedData('The file is empty.');
	}

	const delimiter = detectDelimiter(rows[0].content);
	let points: Point[] = [];

	for (let i = 0; i < rows.length; i++) {
		const { line, content } = rows[i];
		const cells = splitRow(content, delimiter);

		if (cells.length !== 2) {
			return createFailedData(`Line ${line}: expected 2 values (x and y), found ${cells.length}.`);
		}

		const x = parseNumber(cells[0], delimiter);
		const y = parseNumber(cells[1], delimiter);

		if (x === null && y === null && i === 0) {
			continue; // the header row, like "x,y"
		}
		if (x === null || y === null) {
			return createFailedData(`Line ${line}: "${content}" is not a pair of numbers.`);
		}

		points.push({ x, y });
		if (points.length > maxPoints) {
			return createFailedData(`The file has more than ${maxPoints} points.`);
		}
	}

	if (points.length === 0) {
		return createFailedData('No points found in the file.');
	}

	if (options.round) {
		// `|| 0` turns -0 into 0, so a point never shows up as "-0"
		points = points.map(({ x, y }) => ({ x: Math.round(x) || 0, y: Math.round(y) || 0 }));
	}

	if (options.dropClosingPoint && points.length > 1) {
		const first = points[0];
		const last = points[points.length - 1];
		if (first.x === last.x && first.y === last.y) {
			points = points.slice(0, -1);
		}
	}

	return { ok: true, points };
}

function createFailedData(error: string): CsvPointsResult {
	return { ok: false, error };
}

/** the first row decides: a semicolon or a tab means that is the separator, otherwise it is a comma */
function detectDelimiter(firstRow: string): string {
	if (firstRow.includes(';')) {
		return ';';
	}
	if (firstRow.includes('\t')) {
		return '\t';
	}
	return ',';
}

function splitRow(row: string, delimiter: string): string[] {
	const cells = row.split(delimiter).map((cell) => cell.trim().replace(/^"(.*)"$/, '$1').trim());
	// "1,2," from a spreadsheet has an empty cell at the end that is not a third value
	while (cells.length > 2 && cells[cells.length - 1] === '') {
		cells.pop();
	}
	return cells;
}

/** null when the cell is not a plain number; hex, "Infinity" and an empty cell are not numbers here */
function parseNumber(cell: string, delimiter: string): number | null {
	// with a comma between the values a comma cannot also be the decimal mark, so only ; and tab files allow it
	const normalized = delimiter === ',' ? cell : cell.replace(',', '.');
	return NUMBER_PATTERN.test(normalized) ? Number(normalized) : null;
}
