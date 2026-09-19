/**
 * Single source of truth for site-wide facts and the privacy toggles called out
 * in PLAN.md §4. Flip a flag here rather than editing markup.
 */
export const site = {
  name: 'Trevor Dohm',
  title: 'Trevor Dohm',
  tagline: 'AI/ML engineer. I work on transformers, agentic systems, and the infrastructure that runs them.',
  description:
    'Trevor Dohm is an AI/ML engineer at RTX and an MBA candidate at Wharton. Published research on linear attention (Cottention, Best Paper, Computing Conference 2025).',
  location: 'Philadelphia, PA',
  role: 'Software Engineer II at RTX · MBA Candidate at Wharton',
  url: 'https://trevordohm.github.io',

  links: {
    linkedin: 'https://www.linkedin.com/in/trevordohm/',
    email: 'trevordohm@gmail.com',
    github: 'https://github.com/TrevorDohm',
    huggingface: 'https://huggingface.co/TrevorDohm',
  },

  /** PLAN.md §4 open questions. Defaults match what was proposed there. */
  privacy: {
    /** Recommended off: a public page is scraped, a resume is handed to people. */
    showPhone: false,
    showEmail: true,
    /** On both resumes and common on LinkedIn — flip to false to omit. */
    showClearance: true,
  },

  phone: '(310) 433-6570',
  clearance: 'Active TS/SCI (2023) · Polygraph (2024)',
} as const

export const nav = [
  { href: '/', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/experience', label: 'Experience' },
  // Blog is intentionally absent until a first post exists (PLAN.md §3).
] as const
