import { addRipple, clearPointer, holdPointer, setPointer, type MatrixState } from './state'

/**
 * Pointer and focus events on the hero → matrix state. Mouse steers the light
 * freely and lets go when it leaves the hero. Touch and pen steer it only while
 * pressed; with touch-action: pan-y that means horizontal drags, and vertical
 * drags still scroll the page. A press anywhere starts a drop. Hovering or
 * focusing a hero link or button pulls the light onto it and holds it there
 * until the pointer moves off or focus leaves the hero.
 */
export function bindInput(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  state: MatrixState,
): () => void {
  const local = (clientX: number, clientY: number): [number, number] => {
    const rect = canvas.getBoundingClientRect()
    return [clientX - rect.left, clientY - rect.top]
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse' && (e.buttons & 1) === 0) return
    // While over a link or button, stay held on it (set by onTarget).
    if ((e.target as Element | null)?.closest('a, button')) return
    setPointer(state, ...local(e.clientX, e.clientY), performance.now())
  }

  const onDown = (e: PointerEvent) => {
    const [x, y] = local(e.clientX, e.clientY)
    setPointer(state, x, y, performance.now())
    addRipple(state, x, y, performance.now())
  }

  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') clearPointer(state)
    else state.held = false // a tap on a button doesn't hold the light forever
  }

  const onFocusOut = (e: FocusEvent) => {
    if (state.held && !root.contains(e.relatedTarget as Node | null)) clearPointer(state)
  }

  const onTarget = (e: Event) => {
    const target = (e.target as Element | null)?.closest('a, button')
    if (!target || !root.contains(target)) return
    const rect = target.getBoundingClientRect()
    holdPointer(state, ...local(rect.left + rect.width / 2, rect.top + rect.height / 2), performance.now())
  }

  root.addEventListener('pointermove', onMove)
  root.addEventListener('pointerdown', onDown)
  root.addEventListener('pointerleave', onLeave)
  root.addEventListener('pointerover', onTarget)
  root.addEventListener('focusin', onTarget)
  root.addEventListener('focusout', onFocusOut)

  return () => {
    root.removeEventListener('pointermove', onMove)
    root.removeEventListener('pointerdown', onDown)
    root.removeEventListener('pointerleave', onLeave)
    root.removeEventListener('pointerover', onTarget)
    root.removeEventListener('focusin', onTarget)
    root.removeEventListener('focusout', onFocusOut)
  }
}
