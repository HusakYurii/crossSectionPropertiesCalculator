export class FileUploader {
	public uploadCsv(onLoaded: (file: File | undefined) => void) {
		this.uploadFile('.csv', onLoaded);
	}

	public uploadJSON(onLoaded: (file: File | undefined) => void) {
		this.uploadFile('.json', onLoaded);
	}

	private uploadFile(acceptType: string, onLoaded: (file: File | undefined) => void) {
		const input = document.createElement('input');
		input.setAttribute('type', 'file');
		input.setAttribute('accept', acceptType);
		input.addEventListener('change', () => {
			const file = input.files?.[0];
			onLoaded(file);
		});
		input.click();
	}
}

export const fileUploader = new FileUploader();
