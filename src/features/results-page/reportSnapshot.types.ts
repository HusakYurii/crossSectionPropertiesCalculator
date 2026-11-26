import type { ProjectFile } from '@/store/persistence/projectFile';

export type ReportSnapshot = {
	createdAt: string; // ISO
	project: ProjectFile;
};
