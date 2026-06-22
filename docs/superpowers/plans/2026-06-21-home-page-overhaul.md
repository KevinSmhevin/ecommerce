# Home Page Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the home page into a full-bleed hero (with category buttons controlling a rotating image showcase) followed by one horizontally-scrollable product carousel per category.

**Architecture:** Three frontend changes — rework `Hero.tsx` (full-bleed + rotating showcase + category buttons that scroll to sections), add `CategorySection.tsx` (per-category header + scroll-snap carousel of up to 12 `ProductCard`s), and rework `Home.tsx` to render the hero plus a `CategorySection` per category. `MiniBanners.tsx` and the home-page "All Products" `ProductGrid` are removed. No backend changes.

**Tech Stack:** React 18 + TypeScript, Vite, Tailwind 3, TanStack Query, react-router-dom v6, lucide-react icons, Vitest + Testing Library.

## Global Constraints

- TypeScript only — `.tsx`/`.ts`, no `.js`/`.jsx`. Strict mode is on (`noUnusedLocals`, `noUnusedParameters`) — no unused variables/imports.
- Server data goes through TanStack Query hooks (`useCategoriesQuery`, `useProductsQuery`); components must not call `axios` directly.
- Prefer `@/...` path imports over deep relative paths.
- Reuse existing UI: `ProductCard`, `ui/skeleton`, the `glass` CSS class, and the red/lava theme. Do not add a carousel/slider dependency — native CSS scroll-snap only.
- Tests: mock `@/config/axios` (stub `get`, `defaults`, `interceptors.request.use`); wrap renders in a fresh `QueryClientProvider` with `retry: false`, `gcTime: Infinity`; wrap in `MemoryRouter` when the component uses `<Link>`.
- Verify with `npm run typecheck` and `npm run test:run` (run from `frontend/`).
- The section-id convention is the single contract between Hero and the sections: `categorySectionId(slug) === `category-${slug}``, exported from `CategorySection.tsx` and imported by `Hero.tsx`. Never hard-code the string in two places.

---

### Task 1: CategorySection component

One per category: a header (title + "View all →" link) and a horizontally scroll-snapping row of up to 12 `ProductCard`s. Renders nothing when the category has no in-stock products. Exports the shared `categorySectionId` helper.

**Files:**
- Create: `frontend/src/components/CategorySection.tsx`
- Test: `frontend/src/components/CategorySection.test.tsx`

**Interfaces:**
- Consumes: `useProductsQuery({ category })` from `@/hooks/useProductsQuery` → `{ data?: Paginated<Product>, isPending }`; `ProductCard` from `./ProductCard`; `Skeleton` from `./ui/skeleton`; `Category` from `@/types/api`.
- Produces:
  - `export default CategorySection` — props `{ category: Category }`.
  - `export const categorySectionId = (slug: string) => `category-${slug}`` — used by Task 2 (Hero) and Task 3 (Home).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/CategorySection.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import CategorySection from './CategorySection'

vi.mock('@/config/axios', () => {
  const get = vi.fn()
  return { default: { get, defaults: {}, interceptors: { request: { use: vi.fn() } } } }
})

import axios from '@/config/axios'
const mockedGet = axios.get as ReturnType<typeof vi.fn>

const category = { id: 1, name: 'Graded One Piece', slug: 'graded-one-piece' }

const makeProducts = (n: number) => ({
  data: {
    count: n,
    next: null,
    previous: null,
    results: Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      title: `Card ${i + 1}`,
      slug: `card-${i + 1}`,
      price: '9.99',
      stock: 5,
      units_sold: 0,
      image_url: null,
      image2_url: null,
      image3_url: null,
      image4_url: null,
    })),
  },
})

const renderSection = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<CategorySection category={category} />, { wrapper })
}

describe('CategorySection', () => {
  beforeEach(() => {
    mockedGet.mockReset()
  })

  it('renders the category name and a View all link to the category page', async () => {
    mockedGet.mockResolvedValue(makeProducts(3))
    renderSection()
    expect(await screen.findByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Graded One Piece')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /view all/i })
    expect(link).toHaveAttribute('href', '/category/graded-one-piece')
  })

  it('renders at most 12 product cards even when more are returned', async () => {
    mockedGet.mockResolvedValue(makeProducts(20))
    renderSection()
    expect(await screen.findByText('Card 1')).toBeInTheDocument()
    expect(screen.getByText('Card 12')).toBeInTheDocument()
    expect(screen.queryByText('Card 13')).not.toBeInTheDocument()
  })

  it('queries products filtered by the category slug', async () => {
    mockedGet.mockResolvedValue(makeProducts(3))
    renderSection()
    await waitFor(() => {
      const call = mockedGet.mock.calls.find(([url]) => url === '/api/products/')
      expect(call?.[1]).toMatchObject({
        params: expect.objectContaining({ category: 'graded-one-piece' }),
      })
    })
  })

  it('renders nothing when the category has no products', async () => {
    mockedGet.mockResolvedValue({ data: { count: 0, next: null, previous: null, results: [] } })
    const { container } = renderSection()
    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    await waitFor(() => expect(container).toBeEmptyDOMElement())
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm run test:run -- src/components/CategorySection.test.tsx`
Expected: FAIL — cannot resolve `./CategorySection` (module does not exist yet).

- [ ] **Step 3: Write minimal implementation**

Create `frontend/src/components/CategorySection.tsx`:

```tsx
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useProductsQuery } from '@/hooks/useProductsQuery'
import type { Category } from '@/types/api'
import ProductCard from './ProductCard'
import { Skeleton } from './ui/skeleton'

export const categorySectionId = (slug: string) => `category-${slug}`

const MAX_PRODUCTS = 12
const SCROLL_STEP_PX = 600

interface CategorySectionProps {
  category: Category
}

const CategorySection = ({ category }: CategorySectionProps) => {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const productsQuery = useProductsQuery({ category: category.slug })
  const products = (productsQuery.data?.results ?? []).slice(0, MAX_PRODUCTS)

  const scrollByStep = (direction: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: 'smooth' })
  }

  if (!productsQuery.isPending && products.length === 0) return null

  return (
    <section
      id={categorySectionId(category.slug)}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-red-500 rounded-sm rotate-45 shrink-0 shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
          <h2 className="text-white text-base font-black uppercase tracking-widest">{category.name}</h2>
        </div>
        <Link
          to={`/category/${category.slug}`}
          className="flex items-center gap-1 shrink-0 text-white/70 hover:text-red-400 text-xs font-black uppercase tracking-widest transition-colors"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="group/scroller relative">
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByStep(-1)}
          className="hidden md:flex absolute left-0 top-1/2 z-10 h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover/scroller:opacity-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          ref={scrollerRef}
          className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {productsQuery.isPending
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[220px] shrink-0 snap-start">
                  <Skeleton className="aspect-square w-full rounded-2xl" />
                  <Skeleton className="mt-3 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/3" />
                </div>
              ))
            : products.map((product) => (
                <div key={product.id} className="w-[220px] shrink-0 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
        </div>

        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByStep(1)}
          className="hidden md:flex absolute right-0 top-1/2 z-10 h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover/scroller:opacity-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  )
}

export default CategorySection
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm run test:run -- src/components/CategorySection.test.tsx`
Expected: PASS — all 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/CategorySection.tsx frontend/src/components/CategorySection.test.tsx
git commit -m "Add CategorySection with horizontal product carousel

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Hero rework

Full-bleed hero keeping the red "CATCH EVERY CARD" theme. Category buttons (driven by `useCategoriesQuery`) act as tabs for a rotating image showcase: hover previews + pauses auto-rotation; click smooth-scrolls to that category's section using `categorySectionId`.

**Files:**
- Modify (full rewrite): `frontend/src/components/Hero.tsx`
- Test: `frontend/src/components/Hero.test.tsx`

**Interfaces:**
- Consumes: `useCategoriesQuery()` from `@/hooks/useCategoriesQuery` → `{ data?: Category[] }`; `categorySectionId` from `./CategorySection` (Task 1).
- Produces: `export default Hero` — no props (unchanged signature; `Home` renders `<Hero />`).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/Hero.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import Hero from './Hero'

vi.mock('@/config/axios', () => {
  const get = vi.fn()
  return { default: { get, defaults: {}, interceptors: { request: { use: vi.fn() } } } }
})

import axios from '@/config/axios'
const mockedGet = axios.get as ReturnType<typeof vi.fn>

const categories = [
  { id: 1, name: 'Graded Pokemon English', slug: 'graded-pokemon-english' },
  { id: 2, name: 'Graded Pokemon Japanese', slug: 'graded-pokemon-japanese' },
  { id: 3, name: 'Graded One Piece', slug: 'graded-one-piece' },
]

const renderHero = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<Hero />, { wrapper })
}

describe('Hero', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    mockedGet.mockImplementation((url: string) => {
      if (url === '/api/categories/') return Promise.resolve({ data: categories })
      return Promise.reject(new Error(`unexpected ${url}`))
    })
  })

  it('renders a button for each category', async () => {
    renderHero()
    expect(await screen.findByRole('button', { name: 'Graded Pokemon English' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Graded Pokemon Japanese' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Graded One Piece' })).toBeInTheDocument()
  })

  it('marks a category button active on hover', async () => {
    const user = userEvent.setup()
    renderHero()
    const second = await screen.findByRole('button', { name: 'Graded Pokemon Japanese' })
    await user.hover(second)
    await waitFor(() => expect(second).toHaveAttribute('aria-pressed', 'true'))
  })

  it('scrolls to the matching section when a category button is clicked', async () => {
    const user = userEvent.setup()
    const target = document.createElement('div')
    target.id = 'category-graded-one-piece'
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView
    document.body.appendChild(target)

    renderHero()
    const btn = await screen.findByRole('button', { name: 'Graded One Piece' })
    await user.click(btn)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })

    document.body.removeChild(target)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run (from `frontend/`): `npm run test:run -- src/components/Hero.test.tsx`
Expected: FAIL — current `Hero` renders no category buttons (no `useCategoriesQuery`), so `findByRole('button', { name: 'Graded Pokemon English' })` times out / not found.

- [ ] **Step 3: Write minimal implementation**

Replace the entire contents of `frontend/src/components/Hero.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery'
import { categorySectionId } from './CategorySection'

const CATEGORY_IMAGES: Record<string, string> = {
  'graded-pokemon-english': '/banners/mini/graded-pokemon-english.png',
  'graded-pokemon-japanese': '/banners/mini/graded-pokemon-japanese.png',
  'graded-one-piece': '/banners/mini/graded-one-piece.png',
}

const ROTATION_MS = 4000

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const scrollToCategory = (slug: string) => {
  document.getElementById(categorySectionId(slug))?.scrollIntoView({ behavior: 'smooth' })
}

const Hero = () => {
  const { data: categories = [] } = useCategoriesQuery()
  const [activeIndex, setActiveIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || categories.length <= 1 || prefersReducedMotion()) return
    const timer = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % categories.length)
    }, ROTATION_MS)
    return () => window.clearInterval(timer)
  }, [paused, categories.length])

  useEffect(() => {
    if (categories.length > 0 && activeIndex >= categories.length) setActiveIndex(0)
  }, [categories.length, activeIndex])

  return (
    <section className="relative w-full overflow-hidden">
      <div className="glass relative h-[480px] overflow-hidden !rounded-none !border-x-0 !bg-black/40 md:h-[540px]">
        <div
          className="absolute inset-0 bg-gradient-to-br from-red-600 to-red-700"
          style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 30% 100%)' }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 30% 100%)',
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <div className="mb-3 flex items-center gap-2 md:mb-4">
                <div className="h-px w-8 bg-red-500" />
                <p className="text-xs font-black uppercase tracking-widest text-red-500">Premium TCG Store</p>
              </div>
              <h1 className="mb-6 text-4xl font-black uppercase leading-none tracking-tight text-white sm:text-5xl md:text-7xl md:leading-[0.9]">
                CATCH<br />
                <span className="text-red-500">EVERY</span><br />
                CARD.
              </h1>
              <div className="flex flex-wrap gap-3">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={index === activeIndex}
                    onMouseEnter={() => {
                      setActiveIndex(index)
                      setPaused(true)
                    }}
                    onMouseLeave={() => setPaused(false)}
                    onFocus={() => {
                      setActiveIndex(index)
                      setPaused(true)
                    }}
                    onBlur={() => setPaused(false)}
                    onClick={() => scrollToCategory(category.slug)}
                    className={`rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                      index === activeIndex
                        ? 'border-white bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.25)]'
                        : 'border-white/20 bg-white/5 text-white hover:border-red-500 hover:text-red-400'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative hidden h-[380px] md:block">
              {categories.map((category, index) => {
                const image = CATEGORY_IMAGES[category.slug]
                const isActive = index === activeIndex
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-hidden={!isActive}
                    tabIndex={isActive ? 0 : -1}
                    aria-label={`View ${category.name}`}
                    onClick={() => scrollToCategory(category.slug)}
                    className={`absolute inset-0 overflow-hidden rounded-2xl border border-white/15 transition-opacity duration-700 ${
                      isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                  >
                    {image ? (
                      <img src={image} alt={category.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-red-600 to-red-800" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 text-sm font-black uppercase tracking-widest text-white drop-shadow">
                      {category.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
```

- [ ] **Step 4: Run test to verify it passes**

Run (from `frontend/`): `npm run test:run -- src/components/Hero.test.tsx`
Expected: PASS — all 3 tests green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/Hero.tsx frontend/src/components/Hero.test.tsx
git commit -m "Rework Hero into full-bleed banner with category showcase

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Wire up Home, remove MiniBanners and the All Products grid

`Home` renders `<Hero />` plus a `CategorySection` per category. Delete `MiniBanners.tsx` (its imagery now lives in the hero) and stop rendering the paginated `ProductGrid` on the home page (`ProductGrid` itself stays for `CategoryPage`).

**Files:**
- Modify (full rewrite): `frontend/src/pages/Home.tsx`
- Delete: `frontend/src/components/MiniBanners.tsx`

**Interfaces:**
- Consumes: `useCategoriesQuery()` from `@/hooks/useCategoriesQuery`; `Hero` from `@/components/Hero` (Task 2); `CategorySection` from `@/components/CategorySection` (Task 1).
- Produces: `export default Home`.

- [ ] **Step 1: Confirm MiniBanners has no other importers**

Run (from repo root): `grep -rn "MiniBanners" frontend/src`
Expected: only matches are `frontend/src/pages/Home.tsx` (import + usage). If any other file imports it, stop and update that file too. There is no `MiniBanners.test.tsx`.

- [ ] **Step 2: Rewrite Home**

Replace the entire contents of `frontend/src/pages/Home.tsx`:

```tsx
import Hero from '@/components/Hero'
import CategorySection from '@/components/CategorySection'
import { useCategoriesQuery } from '@/hooks/useCategoriesQuery'

const Home = () => {
  const { data: categories = [], isPending } = useCategoriesQuery()

  return (
    <div className="min-h-screen">
      <Hero />
      <div className="pt-12">
        {isPending ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-red-500" />
          </div>
        ) : (
          categories.map((category) => <CategorySection key={category.id} category={category} />)
        )}
      </div>
    </div>
  )
}

export default Home
```

- [ ] **Step 3: Delete the MiniBanners component**

```bash
git rm frontend/src/components/MiniBanners.tsx
```

- [ ] **Step 4: Typecheck**

Run (from `frontend/`): `npm run typecheck`
Expected: PASS — no errors. (Catches any dangling `MiniBanners` / `ProductGrid` import or unused symbol.)

- [ ] **Step 5: Run the full unit-test suite**

Run (from `frontend/`): `npm run test:run`
Expected: PASS — all suites green, including the new `CategorySection` and `Hero` suites and the existing `ProductGrid` suite (still used by `CategoryPage`).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Home.tsx
git commit -m "Rebuild Home page from category carousels; remove MiniBanners

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Full-bleed hero keeping current style → Task 2 (`!rounded-none !border-x-0`, full width, "CATCH EVERY CARD" + red geometric art retained).
- Category buttons overlaid in hero, controlling rotating showcase, hover previews + pauses → Task 2.
- Click button/active image → smooth-scroll to section below → Task 2 (`scrollToCategory` + `categorySectionId`).
- One section per category with horizontal scroll carousel → Task 1.
- "View all →" in section header → `/category/:slug` → Task 1.
- Up to 12 products per carousel → Task 1 (`MAX_PRODUCTS = 12`, `.slice`).
- Empty category renders nothing → Task 1 (`return null`).
- Missing hero image → gradient fallback → Task 2.
- `prefers-reduced-motion` disables rotation → Task 2 (`prefersReducedMotion`).
- Remove MiniBanners → Task 3. Remove home-page All Products grid → Task 3 (Home no longer imports `ProductGrid`); `ProductGrid` retained for `CategoryPage`.
- Vitest tests for new/changed components → Tasks 1 & 2.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every command lists expected output.

**Type consistency:** `categorySectionId` defined in Task 1, imported in Task 2 — same name/signature. `CategorySection` props `{ category: Category }` consistent across Tasks 1 & 3. `Hero` is propless across Tasks 2 & 3. Product fixtures include all required `Product` fields per `@/types/api`.
