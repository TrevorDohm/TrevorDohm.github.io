/**
 * Calls `onChange` when the canvas or any copy box resizes, and when fonts
 * finish loading. The hero is fixed-height, so a font swap or rewrap moves
 * the copy without resizing the canvas or `.hero-copy`; hence each copy box.
 * `onChange` should be cheap when nothing moved (measure()'s key). Returns cleanup.
 */
export function watchLayout(canvas: Element, copyEls: Element[], onChange: () => void): () => void {
  const observer = new ResizeObserver(onChange)
  observer.observe(canvas)
  copyEls.forEach((el) => observer.observe(el))
  document.fonts?.addEventListener('loadingdone', onChange)
  return () => {
    observer.disconnect()
    document.fonts?.removeEventListener('loadingdone', onChange)
  }
}
