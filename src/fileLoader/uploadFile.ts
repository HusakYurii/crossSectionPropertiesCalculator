
function uploadFile(acceptType: string, onLoaded: (file: File | undefined) => void) {
	const input = document.createElement('input');
	input.setAttribute('type', 'file');
	input.setAttribute('accept', acceptType);
	input.addEventListener('change', () => {
		const file = input.files?.[0];
		onLoaded(file);
	});
	input.click();
}

export function uploadCsv(onLoaded: (file: File | undefined) => void) {
	uploadFile('.csv', onLoaded)
}

export function uploadJSON(onLoaded: (file: File | undefined) => void) {
	uploadFile('.json', onLoaded);
}