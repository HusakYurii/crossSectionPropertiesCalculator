export type MenuItem<T extends string> = {
	value: T;
	label: string;
	icon?: string;
	disabled?: boolean;
};

export type NestedMenuLevel<T extends string = string> = {
	items: NestedMenuItem<T>[];
	// method syntax => bivariant param, so NestedMenuLevel<'a'|'b'> fits into children?: NestedMenuLevel
	onSelect(value: T): void;
};

export type NestedMenuItem<T extends string = string> = MenuItem<T> & {
	// A nested level keeps its narrow value type only if declared separately as NestedMenuLevel<X>;
	// an inline one is typed with `string`.
	children?: NestedMenuLevel;
};
