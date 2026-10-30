export const useDebounce = <CB extends (...args: any[]) => void>(cb: CB, delay = 200): [(...args: Parameters<typeof cb>) => void, () => void] => {

	let timeoutID: ReturnType<typeof setTimeout> | undefined;
	const clear = () => clearTimeout(timeoutID);
	const withDebounce = (...args: Parameters<typeof cb>) => {
		clearTimeout(timeoutID);
		timeoutID = setTimeout(() => cb(...args), delay);
	}
	return [
		withDebounce,
		clear
	];

}