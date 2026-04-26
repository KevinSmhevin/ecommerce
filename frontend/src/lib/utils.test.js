import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn (className merge utility)', () => {
  it('returns a single class unchanged', () => {
    expect(cn('foo')).toBe('foo')
  })

  it('merges multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', null, undefined, false, 'bar')).toBe('foo bar')
  })

  it('handles conditional object syntax', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active')
  })

  it('deduplicates conflicting Tailwind classes — last one wins', () => {
    // tailwind-merge resolves conflicts: px-4 then px-6 → px-6
    expect(cn('px-4', 'px-6')).toBe('px-6')
  })

  it('returns empty string for no arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles array inputs', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })
})
