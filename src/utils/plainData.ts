import { toRaw } from 'vue';

const isObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === 'object' && value !== null;
};

/** Deep copy of plain data; reads through proxies. Unlike JSON it keeps NaN and undefined */
export function copyPlainData<T>(value: T): T {
	if (!isObject(value)) {
		return value;
	}
	const source = toRaw(value) as unknown;
	if (Array.isArray(source)) {
		return source.map(item => copyPlainData(item)) as T;
	}
	const result: Record<string, unknown> = {};
	for (const key of Object.keys(source as object)) {
		result[key] = copyPlainData((source as Record<string, unknown>)[key]);
	}
	return result as T;
}

/** Deep equality with Object.is for numbers, so NaN equals NaN */
export function isSamePlainData(a: unknown, b: unknown): boolean {
	if (Object.is(a, b)) {
		return true;
	}
	if (!isObject(a) || !isObject(b)) {
		return false;
	}
	const rawA = toRaw(a);
	const rawB = toRaw(b);
	if (rawA === rawB) {
		return true;
	}
	if (Array.isArray(rawA) || Array.isArray(rawB)) {
		if (!Array.isArray(rawA) || !Array.isArray(rawB) || rawA.length !== rawB.length) {
			return false;
		}
		for (let i = 0; i < rawA.length; i++) {
			if (!isSamePlainData(rawA[i], rawB[i])) {
				return false;
			}
		}
		return true;
	}
	const keysA = Object.keys(rawA);
	if (keysA.length !== Object.keys(rawB).length) {
		return false;
	}
	for (const key of keysA) {
		if (!Object.prototype.hasOwnProperty.call(rawB, key) || !isSamePlainData(rawA[key], rawB[key])) {
			return false;
		}
	}
	return true;
}
