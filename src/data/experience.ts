export interface Role {
  org: string
  role: string
  location: string
  period: string
  note?: string
  points: string[]
}

export const experience: Role[] = [
  {
    org: 'RTX',
    role: 'Software Engineer II',
    location: 'Dallas, TX',
    period: '2023 – Present',
    note: 'Promoted 9 months ahead of the standard timeline; retained part-time through the MBA to continue leading AI programs.',
    points: [
      'Technical lead on ATLAS, an enterprise agentic AI assistant deployed in an air-gapped environment.',
      'Drove AWS cloud migration across 10+ classified enclaves, engineering the Kubernetes architecture with GPU autoscaling and an observability stack.',
      'Delivered company-wide symposium keynotes on enterprise AI/ML implementation to 50+ executives (2025 ISaCTN, 2026 SE&ATN).',
      'Earned 1 of 15 seats in a semiannual leadership program taught by RTX senior management.',
      'Surfaced systemic test failures to program leadership and owned the fix, leading 4 focus groups across engineering, test, and program management to take a 100+ person program from persistently failing builds to consistently passing.',
    ],
  },
  {
    org: 'Southern Methodist University',
    role: 'Undergraduate Researcher',
    location: 'Dallas, TX',
    period: 'Sep 2023 – May 2024',
    note: 'Advised by Dr. Eric Larson.',
    points: [
      'Designed a novel linear attention mechanism replacing softmax with cosine similarity (Cottention).',
      'Built custom CUDA/Triton kernels and a petabyte-scale data pipeline for distributed training on a 20-node NVIDIA DGX A100 SuperPOD.',
      'Coauthored the resulting paper, accepted at Computing Conference 2025 (Springer LNNS) and awarded Best Paper.',
      'Awarded 3rd place in the college-wide undergraduate research showcase, advancing to a graduate-level forum.',
    ],
  },
  {
    org: 'Croquet',
    role: 'Software Developer',
    location: 'Los Angeles, CA',
    period: 'May 2022 – Dec 2022',
    points: [
      'Built a crane simulation featured in investor demos, supporting a $2.7MM seed raise.',
      'Codesigned interactive metaverse environments with a 10-engineer team, advancing MVP development with real-time physics.',
      'Shipped 5+ customer-facing features under daily turnaround expectations.',
    ],
  },
]

export interface Education {
  school: string
  degree: string
  location: string
  period: string
  points: string[]
}

export const education: Education[] = [
  {
    school: 'The Wharton School, University of Pennsylvania',
    degree: 'MBA Candidate — Quantitative Finance',
    location: 'Philadelphia, PA',
    period: 'Expected May 2028',
    points: [],
  },
  {
    school: 'Southern Methodist University',
    degree:
      'B.S. Computer Science (AI/ML), B.S. Mathematics (Computational), B.S. Data Science',
    location: 'Dallas, TX',
    period: 'May 2024',
    points: [
      'Summa Cum Laude — 3.99 cumulative GPA.',
      'Senior thesis: Cottention: Linear Transformers with Cosine Attention (Computing Conference 2025, Springer LNNS, Best Paper).',
      'Departmental Distinction in Computer Science; John Robert McCaw Merit Award.',
      'Vice President, Computer Science Club and Artificial Intelligence Club.',
    ],
  },
]

export const skills: { group: string; items: string[] }[] = [
  {
    group: 'AI/ML',
    items: [
      'Transformers', 'VLMs', 'LLM Agents', 'RAG', 'Quantization',
      'PyTorch', 'Hugging Face', 'CUDA/Triton', 'LangChain', 'Vector Databases',
    ],
  },
  {
    group: 'Systems',
    items: [
      'Python', 'C', 'AWS', 'Kubernetes', 'Docker/Podman',
      'PostgreSQL', 'Grafana', 'Prometheus', 'Loki', 'GitLab CI/CD', 'SLURM/HPC',
    ],
  },
  {
    group: 'Certifications',
    items: [
      'AWS Solutions Architect – Associate', 'CompTIA Security+', 'CKAD',
    ],
  },
]
