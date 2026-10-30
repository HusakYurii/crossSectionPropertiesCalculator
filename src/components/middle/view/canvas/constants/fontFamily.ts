/**
 * The one typeface of the app. style.css sets the page font from the CSS variable --font-family; a canvas cannot
 * use a CSS variable in `context.font`, so it reads the same family from here. Keep the two in step.
 */
export const FONT_FAMILY = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
