import { MIME_CSV } from "./mimeTypes";

function triggerDownload(fileName: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');

	link.href = url;
	link.download = fileName;
	link.style.display = 'none';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * For CSV because it adds BOM character for Excel
 */
export function downloadCsv(fileName: string, content: string): void {
	const blob = new Blob(['\uFEFF', content], { type: MIME_CSV });
	triggerDownload(fileName, blob);
}

/**
 * 
 * For text formats like TXT, JSON, SVG
 */
export function downloadText(fileName: string, content: string, mimeType: string): void {
	const blob = new Blob([content], { type: mimeType });
	triggerDownload(fileName, blob);
}


/**
 * For images like PNG, JPEG
 */
export function downloadImage(fileName: string, blob: Blob): void {
	triggerDownload(fileName, blob);
}
