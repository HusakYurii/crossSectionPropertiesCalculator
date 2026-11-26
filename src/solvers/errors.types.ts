export type SolverErrorCode = 'no-strategy' | 'strategy-failed' | 'no-shapes' | 'no-area';

export interface SolverError<C extends SolverErrorCode = SolverErrorCode> {
	readonly code: C;
	readonly message: string;
	readonly cause?: unknown;
}

export type Result<T, E = SolverError> =
	| { readonly ok: true; readonly value: T }
	| { readonly ok: false; readonly error: E };
