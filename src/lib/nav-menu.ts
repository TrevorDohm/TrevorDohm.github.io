/**
 * Closes the mobile <details> menu on an outside click or Escape.
 * Listens on document (clicks outside the root must be seen) but only
 * changes the menu inside `root`.
 */
export function init(root: HTMLElement): () => void {
  const menu = root.querySelector<HTMLDetailsElement>('[data-nav-menu]')
  if (!menu) return () => {}

  const onClick = (e: MouseEvent) => {
    if (menu.open && !menu.contains(e.target as Node)) menu.open = false
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && menu.open) {
      menu.open = false
      menu.querySelector('summary')?.focus()
    }
  }

  document.addEventListener('click', onClick)
  document.addEventListener('keydown', onKey)
  return () => {
    document.removeEventListener('click', onClick)
    document.removeEventListener('keydown', onKey)
  }
}
