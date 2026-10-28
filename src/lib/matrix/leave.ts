/**
 * Marks `root` with `data-matrix-leaving` once the page starts to unload (a
 * reload or a link), and clears it if the page comes back from the
 * back/forward cache. The hero's CSS then clips off the faded rows under the
 * nav: on a pull-to-refresh, iOS Safari can draw the old page's last frame
 * with the nav shifted up under the status bar for a few frames, which would
 * flash those rows at the top of the screen. Returns a cleanup function.
 */
export function watchLeave(root: HTMLElement): () => void {
  const leave = () => {
    root.dataset.matrixLeaving = ''
  }
  const back = () => {
    delete root.dataset.matrixLeaving
  }
  addEventListener('beforeunload', leave)
  addEventListener('pagehide', leave)
  addEventListener('pageshow', back)
  return () => {
    removeEventListener('beforeunload', leave)
    removeEventListener('pagehide', leave)
    removeEventListener('pageshow', back)
    back()
  }
}
