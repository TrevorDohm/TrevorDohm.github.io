import { describe, expect, it } from 'vitest'
import type { Palette } from '../matrix/renderer'
import { drawPattern } from './draw'
import { cellRect } from './geometry'

const palette: Palette = { line: [10, 20, 30], accent: [100, 150, 200], accent2: [200, 100, 250] }

/** Records the calls drawPattern makes, with the fill color current at each fill. */
function fakeContext() {
  const calls: { op: string; args: number[]; fill?: string }[] = []
  const ctx = {
    fillStyle: '',
    clearRect: (...args: number[]) => calls.push({ op: 'clear', args }),
    beginPath: () => {},
    roundRect: (...args: number[]) => calls.push({ op: 'rect', args }),
    fill() {
      calls.push({ op: 'fill', args: [], fill: this.fillStyle })
    },
  }
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls }
}

describe('drawPattern', () => {
  it('clears first, then draws one rounded cell per weight at cellRect', () => {
    const { ctx, calls } = fakeContext()
    drawPattern(ctx, new Float32Array(9), 3, 424, palette)
    expect(calls[0]).toEqual({ op: 'clear', args: [0, 0, 424, 424] })
    const rects = calls.filter((c) => c.op === 'rect')
    expect(rects).toHaveLength(9)
    const { x, y, w, r } = cellRect(2, 1, 3, 424)
    expect(rects[2 * 3 + 1].args).toEqual([x, y, w, w, r])
  })

  it('colors cells on the ramp, with weights above 1 at the top color', () => {
    const { ctx, calls } = fakeContext()
    drawPattern(ctx, Float32Array.from([0, 0.6, 1, 3]), 2, 424, palette)
    expect(calls.filter((c) => c.op === 'fill').map((c) => c.fill)).toEqual([
      'rgb(10,20,30)',
      'rgb(100,150,200)',
      'rgb(200,100,250)',
      'rgb(200,100,250)',
    ])
  })
})
