type Func = (...args: any[]) => void;

type WithDebounce<T extends Func> = (...args: Parameters<T>) => void;
type Clear = () => void;
type Flush = () => void;

export const useDebounce = <CB extends Func>(cb: CB, delay = 200): [
	WithDebounce<CB>,
	Clear,
	Flush
] => {

	let timeoutID: ReturnType<typeof setTimeout> | undefined;
	let pendingArgs: Parameters<CB> | undefined;
	const clear = () => {
		clearTimeout(timeoutID);
		pendingArgs = undefined;
	};
	const withDebounce = (...args: Parameters<CB>) => {
		clearTimeout(timeoutID);
		pendingArgs = args;
		timeoutID = setTimeout(() => {
			pendingArgs = undefined;
			cb(...args);
		}, delay);
	}
	/** runs the call that is waiting right now, if any, instead of waiting for the delay */
	const flush = () => {
		if (!pendingArgs) {
			return;
		}
		const args = pendingArgs;
		clear();
		cb(...args);
	}
	return [
		withDebounce,
		clear,
		flush
	];

}
