import { describe, it, expect } from 'vitest'
import { displayCategoryName, selectFeaturedCategories } from './categories'
import type { Category } from '@/types/api'

const cat = (id: number, name: string, slug: string): Category => ({ id, name, slug })

describe('selectFeaturedCategories', () => {
  it('keeps only the three featured graded categories', () => {
    const result = selectFeaturedCategories([
      cat(1, 'Graded Pokemon English', 'graded-pokemon-english'),
      cat(2, 'Funko Pops', 'funko-pops'),
      cat(3, 'Graded One Piece', 'graded-one-piece'),
      cat(4, 'Trading Cards', 'trading-cards'),
      cat(5, 'Graded Pokemon Japanese', 'graded-pokemon-japanese'),
    ])
    expect(result.map((c) => c.slug)).toEqual([
      'graded-pokemon-english',
      'graded-pokemon-japanese',
      'graded-one-piece',
    ])
  })

  it('returns them in the featured order regardless of input order', () => {
    const result = selectFeaturedCategories([
      cat(3, 'Graded One Piece', 'graded-one-piece'),
      cat(1, 'Graded Pokemon English', 'graded-pokemon-english'),
    ])
    expect(result.map((c) => c.slug)).toEqual(['graded-pokemon-english', 'graded-one-piece'])
  })

  it('omits featured categories that are absent from the input', () => {
    const result = selectFeaturedCategories([cat(1, 'Funko Pops', 'funko-pops')])
    expect(result).toEqual([])
  })
})

describe('displayCategoryName', () => {
  it('strips a leading "Graded " prefix case-insensitively', () => {
    expect(displayCategoryName('Graded Pokemon English')).toBe('Pokemon English')
    expect(displayCategoryName('graded one piece')).toBe('one piece')
  })

  it('leaves names without the prefix untouched', () => {
    expect(displayCategoryName('Funko Pops')).toBe('Funko Pops')
  })

  it('only strips the prefix, not occurrences elsewhere', () => {
    expect(displayCategoryName('Pokemon Graded Set')).toBe('Pokemon Graded Set')
  })
})
