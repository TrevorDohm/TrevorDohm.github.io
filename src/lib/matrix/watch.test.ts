import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { watchLayout } from './watch'

class FakeResizeObserver {
  static last: FakeResizeObserver
  observed: Element[] = []
  disconnected = false
  constructor(readonly cb: () => void) {
    FakeResizeObserver.last = this
  }
  observe(el: Element) {
    this.observed.push(el)
  }
  disconnect() {
    this.disconnected = true
  }
}

const el = (name: string) => ({ name }) as unknown as Element

describe('watchLayout', () => {
  let fonts: EventTarget
  beforeEach(() => {
    fonts = new EventTarget()
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    vi.stubGlobal('document', { fonts })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('observes the canvas and every copy element', () => {
    const [canvas, a, b] = [el('canvas'), el('a'), el('b')]
    watchLayout(canvas, [a, b], () => {})
    expect(FakeResizeObserver.last.observed).toEqual([canvas, a, b])
  })

  it('passes the callback to the observer', () => {
    const cb = vi.fn()
    watchLayout(el('c'), [], cb)
    expect(FakeResizeObserver.last.cb).toBe(cb)
  })

  it('calls back when fonts finish loading', () => {
    const cb = vi.fn()
    watchLayout(el('c'), [], cb)
    fonts.dispatchEvent(new Event('loadingdone'))
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('disconnects and stops listening on cleanup', () => {
    const cb = vi.fn()
    const stop = watchLayout(el('c'), [el('a')], cb)
    stop()
    expect(FakeResizeObserver.last.disconnected).toBe(true)
    fonts.dispatchEvent(new Event('loadingdone'))
    expect(cb).not.toHaveBeenCalled()
  })

  it('works without document.fonts', () => {
    vi.stubGlobal('document', {})
    let stop = () => {}
    expect(() => (stop = watchLayout(el('c'), [], () => {}))).not.toThrow()
    expect(() => stop()).not.toThrow()
    expect(FakeResizeObserver.last.disconnected).toBe(true)
  })
})
