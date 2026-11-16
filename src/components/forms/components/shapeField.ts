type NumericKeys<G> = { [K in keyof G]: G[K] extends number ? K : never }[keyof G] & string;

// a shape's field list never includes rotation or isNegative: every form keeps those two hand-written
export type ShapeField<G = any> = { key: NumericKeys<G>; label: string; unit: string };
