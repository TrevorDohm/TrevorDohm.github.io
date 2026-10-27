/**
 * The value of custom property `name` in a stylesheet's source, so values a
 * CSS variable can't reach (such as a meta tag) read the same token. Throws
 * if it is missing, so renaming the token fails the build instead of
 * shipping an empty value.
 */
export function cssToken(css: string, name: string): string {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`${escaped}\\s*:\\s*([^;]+);`).exec(css)
  if (!match) throw new Error(`CSS token ${name} not found`)
  return match[1].trim()
}
