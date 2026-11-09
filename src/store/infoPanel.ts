import { reactive } from 'vue';

export const INFO_TOPICS = {
	whatIsNegativeArea: 'whatIsNegativeArea',
	whatIsGreensTheoremSolver: 'whatIsGreensTheoremSolver',
	whatIsFEMSolver: 'whatIsFEMSolver',
	whatIsCustomShapeCsvFormat: 'whatIsCustomShapeCsvFormat',
	aboutThisApp: 'aboutThisApp',
	whatIsCompositeSolver: 'whatIsCompositeSolver',
	whatIsClassicSolver: 'whatIsClassicSolver',
} as const;

export type InfoTopic = keyof typeof INFO_TOPICS;

export const infoPanelState = reactive<{ topic: InfoTopic | null }>({ topic: null });

export function openInfoPanel(topic: InfoTopic) {
	infoPanelState.topic = topic;
}

export function closeInfoPanel() {
	infoPanelState.topic = null;
}
