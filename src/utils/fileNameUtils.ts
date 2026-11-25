// characters the operating systems do not allow in a file name, and control characters
// eslint-disable-next-line no-control-regex
const INVALID_FILE_NAME_CHARS = /[\\/:*?"<>|\u0000-\u001f\u007f]/g;

/** the name without the invalid characters and the edge spaces, as it will be written (without the extension) */
export function sanitizeFileName(name: string, extension: string): string {
	const escapedExtension = extension.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	return name
		.replace(INVALID_FILE_NAME_CHARS, '')
		.trim()
		// the user may type the extension themselves, so it is not doubled
		.replace(new RegExp(`\\.${escapedExtension}$`, 'i'), '')
		// Windows drops trailing dots and spaces, so they are not left in the name
		.replace(/[. ]+$/, '');
}

/** a safe file name with one extension at the end; an empty result falls back to the default name */
export function normalizeFileName(name: string, extension: string, defaultName: string): string {
	return `${sanitizeFileName(name, extension) || defaultName}.${extension}`;
}
