import { MIME_CSV } from "./mimeTypes";

export class FilesDownloader {
	/**
	 * For CSV because it adds BOM character for Excel
	 */
	public downloadCsv(fileName: string, content: string): void {
		const blob = new Blob(['\uFEFF', content], { type: MIME_CSV });
		this.triggerDownload(fileName, blob);
	}

	/**
	 * 
	 * For text formats like TXT, JSON, SVG
	 */
	public downloadText(fileName: string, content: string, mimeType: string): void {
		const blob = new Blob([content], { type: mimeType });
		this.triggerDownload(fileName, blob);
	}

	/**
	 * For images like PNG, JPEG
	 */
	public downloadImage(fileName: string, blob: Blob): void {
		this.triggerDownload(fileName, blob);
	}

	private triggerDownload(fileName: string, blob: Blob): void {
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
}

export const filesDownloader = new FilesDownloader();
