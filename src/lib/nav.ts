/**
 * Nav highlighting. Pure (no DOM access) so it can be unit tested.
 */
export function normalizePath(path: string): string {
  if (path === '/') return '/'
  return path.replace(/\/+$/, '')
}

export function isActivePath(pathname: string, href: string): boolean {
  const current = normalizePath(pathname)
  const target = normalizePath(href)
  if (target === '/') return current === '/'
  return current === target || current.startsWith(`${target}/`)
}
