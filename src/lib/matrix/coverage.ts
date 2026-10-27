/** A vertical extent in viewport px. */
export interface Span {
  top: number
  bottom: number
}

/**
 * Whether the canvas covers the hero, give or take half a pixel of rounding.
 * Stale or unsupported CSS can collapse or move it; then the matrix isn't
 * drawn and the static name stays, rather than the page being marked ready
 * over a canvas nobody can see. Pure.
 */
export function coversHero(hero: Span, canvas: Span): boolean {
  if (canvas.bottom - canvas.top <= 0) return false
  return canvas.top <= hero.top + 0.5 && canvas.bottom >= hero.bottom - 0.5
}
