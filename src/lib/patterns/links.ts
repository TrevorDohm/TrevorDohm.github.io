/**
 * Copies of the cards are inert, so their links can't be clicked, and about
 * half the visible cards are copies. A click on a copy's link, found by
 * geometry, clicks the real link instead, so its target and rel still apply.
 * The row gets data-link-hover while the pointer is over such a link.
 */
export function initCopyLinks(root: HTMLElement): () => void {
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-marquee-row]'))

  const copyLinkAt = (event: MouseEvent) =>
    Array.from(root.querySelectorAll<HTMLAnchorElement>('[inert] a[href]')).find((link) => {
      const r = link.getBoundingClientRect()
      return event.clientX >= r.left && event.clientX < r.right && event.clientY >= r.top && event.clientY < r.bottom
    })

  const onClick = (event: MouseEvent) => {
    const copy = copyLinkAt(event)
    if (!copy) return
    const real = Array.from(root.querySelectorAll<HTMLAnchorElement>('a[href]')).find(
      (a) => a.href === copy.href && !a.closest('[inert]'),
    )
    real?.click()
  }
  const onMove = (event: PointerEvent) => {
    const row = event.currentTarget as HTMLElement
    row.toggleAttribute('data-link-hover', Boolean(copyLinkAt(event)))
  }
  const onLeave = (event: PointerEvent) => (event.currentTarget as HTMLElement).removeAttribute('data-link-hover')

  for (const row of rows) {
    row.addEventListener('click', onClick)
    row.addEventListener('pointermove', onMove)
    row.addEventListener('pointerleave', onLeave)
  }
  return () => {
    for (const row of rows) {
      row.removeEventListener('click', onClick)
      row.removeEventListener('pointermove', onMove)
      row.removeEventListener('pointerleave', onLeave)
      row.removeAttribute('data-link-hover')
    }
  }
}
