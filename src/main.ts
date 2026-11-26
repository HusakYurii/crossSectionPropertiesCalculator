import { createApp } from 'vue'
import 'vue3-toastify/dist/index.css';
import './app/styles/style.css'
import { ReportPage, loadReportSnapshot } from '@/features/report'
import { loadProjectData } from '@/store/persistence/storeDataImporter'
import App from './app/App.vue';

// the report opens in a new tab of the same bundle: `?report=<id>` points to a snapshot saved by File -> Show Results
const reportId = new URLSearchParams(window.location.search).get('report');

if (reportId) {
	document.documentElement.classList.add('report-mode');
	const snapshot = loadReportSnapshot(reportId);
	const ok = snapshot !== null && loadProjectData(snapshot.project) === 'ok';
	createApp(ReportPage, { snapshot: ok ? snapshot : null }).mount('#app');
} else {
	createApp(App).mount('#app');
}
