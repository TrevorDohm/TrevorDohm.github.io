import { describe, expect, it } from 'vitest'
import { isActivePath, normalizePath } from './nav'

describe('normalizePath', () => {
  it('keeps the root path', () => {
    expect(normalizePath('/')).toBe('/')
  })

  it('strips trailing slashes', () => {
    expect(normalizePath('/projects/')).toBe('/projects')
    expect(normalizePath('/projects//')).toBe('/projects')
  })
})

describe('isActivePath', () => {
  it('matches home only on the root path', () => {
    expect(isActivePath('/', '/')).toBe(true)
    expect(isActivePath('/projects', '/')).toBe(false)
  })

  it('matches a section with or without a trailing slash', () => {
    expect(isActivePath('/projects', '/projects')).toBe(true)
    expect(isActivePath('/projects/', '/projects')).toBe(true)
  })

  it('matches pages nested under a section', () => {
    expect(isActivePath('/projects/cottention', '/projects')).toBe(true)
  })

  it('does not match a path that only shares a prefix', () => {
    expect(isActivePath('/projects-archive', '/projects')).toBe(false)
  })
})
