import type { Result, SolverError, SolverErrorCode } from './errors.types';

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const fail = <C extends SolverErrorCode>(code: C, message: string, cause?: unknown): Result<never, SolverError<C>> =>
	({ ok: false, error: { code, message, cause } });

/** `catch (e)` → the message the solvers showed so far */
export const errorMessage = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback);
