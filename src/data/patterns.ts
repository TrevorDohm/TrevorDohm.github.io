import type { PatternId } from '../lib/patterns/patterns'

export interface PatternCardData {
  id: PatternId
  name: string
  /** Short mono label shown beside the name. */
  kind: string
  /** One plain line. Only the Cottention card describes Trevor's own work. */
  caption: string
  /** Slug of the project in projects.ts whose paper the card links to; the page looks the link up there. */
  paper?: string
  /** The paper link, filled in by the page from `paper`. */
  href?: string
}

export const patterns: PatternCardData[] = [
  {
    id: 'full',
    name: 'Full attention',
    kind: 'softmax',
    caption: 'Every token looks at every other. Quadratic, and the reason long context is expensive.',
  },
  {
    id: 'causal',
    name: 'Causal',
    kind: 'decoder',
    caption: 'Each token sees only what came before it. This is how GPT-style models write.',
  },
  {
    id: 'window',
    name: 'Sliding window',
    kind: 'local',
    caption: 'Attend only to nearby tokens. Cheap, and often good enough.',
  },
  {
    id: 'sparse',
    name: 'Block-sparse',
    kind: 'global + local',
    caption: 'A few global tokens, a local window, and random links between them.',
  },
  {
    // Caption traces to the Cottention blurb in projects.ts.
    id: 'cosine',
    name: 'Cottention',
    kind: 'cosine',
    caption: 'Cosine similarity instead of softmax. Linear memory in sequence length.',
    paper: 'cottention',
  },
  {
    id: 'induction',
    name: 'Induction head',
    kind: 'copy',
    caption: 'Finds where the current token appeared before and looks just after it.',
  },
]
