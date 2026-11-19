import { computed, ref } from 'vue';
import type { Point } from '../../../../interfaces/common/types.ts';
import { openInfoPanel } from '../../../../store/infoPanel.ts';
import { pickCsvPoints } from '../csv/pickCsvPoints.ts';
import { DEFAULT_CSV_FILE_NAME, exportCsvPoints } from '../csv/exportCsvPoints.ts';

type CustomShapeCsvProps = {
	/** the points that get exported */
	points: () => Point[];
	/** gets the points of an imported file; the form decides what replacing them means */
	onImport: (points: Point[]) => void;
};

/** CSV import and export of the custom shape points, plus the state of the export name modal */
export function useCustomShapeCsv(props: CustomShapeCsvProps) {
	const { points, onImport } = props;
	const isExportModalOpen = ref(false);
	const canExport = computed(() => points().length > 0);

	function openExportModal() {
		isExportModalOpen.value = true;
	}

	function closeExportModal() {
		isExportModalOpen.value = false;
	}

	function confirmExport(name: string) {
		closeExportModal();
		exportCsvPoints(name, points());
	}

	function importCsv() {
		pickCsvPoints(onImport);
	}

	function openCsvInfo() {
		openInfoPanel('whatIsCustomShapeCsvFormat');
	}

	return {
		defaultFileName: DEFAULT_CSV_FILE_NAME,
		isExportModalOpen,
		canExport,
		openExportModal,
		closeExportModal,
		confirmExport,
		importCsv,
		openCsvInfo,
	};
}
