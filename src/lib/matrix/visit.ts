/**
 * The intro plays in full once per browser session. Pure: decides where the
 * intro clock starts, and when a visit counts as having seen it.
 */
import { BREAK_AT, introStart, STILL_AT } from './intro'

/** The sessionStorage key set once a visitor has seen the intro (IntroGate reads it too). */
export const SEEN_KEY = 'intro-seen'

export interface IntroPlan {
  /** Where the intro clock starts (s). */
  clock: number
  /** Show the role line and buttons at once rather than on the intro's cue. */
  copyNow: boolean
}

/**
 * `still`: reduced motion, so the still frame in the hold. `seen`: the intro
 * already played this session, so start lit in the hold (as `introStart(true)`)
 * with the copy up, and let the name break into the ghost as usual. `shown`:
 * the CSS safety net already revealed the static name, so start lit too.
 */
export function introPlan({ still, shown, seen }: { still: boolean; shown: boolean; seen: boolean }): IntroPlan {
  if (still) return { clock: STILL_AT, copyNow: false }
  return { clock: introStart(shown || seen), copyNow: seen }
}

/** A visit has seen the intro once the name starts to break; one cut short before that plays in full next time. */
export function seenBy(clock: number): boolean {
  return clock >= BREAK_AT
}
