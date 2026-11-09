import { createApp } from 'vue'
import 'vue3-toastify/dist/index.css';
// after the library's own stylesheet, so where both set the same variable ours wins
import './style.css'
import 'katex/dist/katex.min.css'
import './styles/markdown.css'
import App from './App.vue'
import ReportPage from './pages/report/ReportPage.vue'
import { loadReportSnapshot } from './pages/report/reportSnapshot'
import { loadProjectData } from './store/storeDataImporter'

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
