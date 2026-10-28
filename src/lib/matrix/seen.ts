import { SEEN_KEY } from './visit'

/**
 * Whether this tab's session has seen the intro. Storage can throw (blocked
 * site data, some private modes); then it counts as a first visit.
 */
export function readSeen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/** Records that this session has seen the intro; a no-op where storage is unavailable. */
export function markSeen(): void {
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage unavailable: the next visit plays the full intro again.
  }
}
