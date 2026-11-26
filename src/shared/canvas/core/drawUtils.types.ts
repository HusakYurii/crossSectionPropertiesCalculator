export type LeaderSide = 'left' | 'right';
/** which way the shelf goes from the anchor (world y is up) */
export type LeaderVertical = 'top' | 'bottom';

/** All sizes are screen pixels, owned by the annotation that draws the leader. */
export type LeaderStyle = {
	lineWidth: number;
	fontSize: number;
	/** length of the 45deg segment going out of the anchor */
	diagonal: number;
	/** length of the horizontal segment the label sits on */
	shelf: number;
	/** gap between the shelf and the label */
	labelGap: number;
};
