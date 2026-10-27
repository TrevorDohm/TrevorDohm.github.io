export type InterestCategory = 'ml' | 'mba' | 'bake' | 'hike'

export interface Interest {
  label: string
  category: InterestCategory
}

export const interests: Interest[] = [
  { label: 'Cottention', category: 'ml' },
  { label: 'CUDA Kernels', category: 'ml' },
  { label: 'Linear Transformers', category: 'ml' },
  { label: 'Triton', category: 'ml' },
  { label: 'Agents', category: 'ml' },
  { label: 'Air-Gapped LLMs', category: 'ml' },
  { label: 'Wharton', category: 'mba' },
  { label: 'Quant Finance', category: 'mba' },
  { label: 'Options Pricing', category: 'mba' },
  { label: 'Black–Scholes', category: 'mba' },
  { label: 'Blueberry Yuzu Cookies', category: 'bake' },
  { label: 'Raspberry Kouign Amann', category: 'bake' },
  { label: 'Piña Colada Danish', category: 'bake' },
  { label: 'Orange Cardamom Morning Bun', category: 'bake' },
  { label: 'Country Sourdough', category: 'bake' },
  { label: 'Lamination at 3 a.m.', category: 'bake' },
  { label: 'Half Dome', category: 'hike' },
  { label: 'Angel’s Landing', category: 'hike' },
  { label: 'The Wave', category: 'hike' },
  { label: 'Paintbrush Divide', category: 'hike' },
]

/**
 * Source for the bake items above, from Trevor's MBA resume. Not rendered yet.
 */
export const bakingRole = {
  org: 'Bresnan Bread & Pastry',
  role: 'Operations Lead, Overnight Pastry Baker',
  location: 'McKinney, TX',
  period: '2025 – 2026',
}
