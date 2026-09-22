import { cellAt, type Grid } from './geometry'
import { addRipple, setQuery, type MatrixState } from './state'

/**
 * Pointer and focus events on the hero → matrix state. Mouse moves the query
 * freely. Touch and pen move it only while pressed; with touch-action: pan-y
 * that means horizontal drags, and vertical drags still scroll the page. A
 * press anywhere starts a ripple. Hovering or focusing a hero link or button
 * pulls the query onto it.
 */
export function bindInput(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  state: MatrixState,
  getGrid: () => Grid | null,
): () => void {
  const local = (clientX: number, clientY: number): [number, number] => {
    const rect = canvas.getBoundingClientRect()
    return [clientX - rect.left, clientY - rect.top]
  }

  const point = (x: number, y: number) => {
    setQuery(state, x, y, performance.now())
    const grid = getGrid()
    state.hover = grid ? cellAt(grid, x, y) : -1
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && (e.buttons & 1) === 0) return
    // While over a link or button, stay snapped to it (set by onTarget).
    if ((e.target as Element | null)?.closest('a, button')) return
    point(...local(e.clientX, e.clientY))
  }

  const onDown = (e: PointerEvent) => {
    const [x, y] = local(e.clientX, e.clientY)
    point(x, y)
    addRipple(state, x, y, performance.now())
  }

  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') state.hover = -1
  }

  const onTarget = (e: Event) => {
    const target = (e.target as Element | null)?.closest('a, button')
    if (!target || !root.contains(target)) return
    const rect = target.getBoundingClientRect()
    point(...local(rect.left + rect.width / 2, rect.top + rect.height / 2))
  }

  root.addEventListener('pointermove', onMove)
  root.addEventListener('pointerdown', onDown)
  root.addEventListener('pointerleave', onLeave)
  root.addEventListener('pointerover', onTarget)
  root.addEventListener('focusin', onTarget)

  return () => {
    root.removeEventListener('pointermove', onMove)
    root.removeEventListener('pointerdown', onDown)
    root.removeEventListener('pointerleave', onLeave)
    root.removeEventListener('pointerover', onTarget)
    root.removeEventListener('focusin', onTarget)
  }
}
