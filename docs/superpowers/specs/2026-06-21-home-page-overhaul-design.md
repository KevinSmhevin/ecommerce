# Home Page Overhaul — Design

Date: 2026-06-21
Status: Approved (pending spec review)

## Goal

Restructure the Pokebin home page to a cookiegrips.com-style layout:

1. A **full-bleed hero** spanning the entire viewport width.
2. **Category buttons overlaid inside the hero** that control a rotating image
   showcase and scroll to the matching section below.
3. **One section per category** beneath the hero, each with a
   horizontally-scrollable row of product cards and a "View all" button that
   links to the full category page.

The existing dark-glass / red lava theme and the current "CATCH EVERY CARD"
hero styling are preserved — this is a layout and interaction change, not a
visual redesign.

## Current State (for reference)

- `Home.tsx` renders `<Hero />`, `<MiniBanners />`, `<ProductGrid />`.
- `Hero.tsx` — contained (`max-w-7xl`), rounded card, red geometric clip-path
  art, "CATCH EVERY CARD" headline, a "SHOP NOW" button that scrolls to
  `#products`, and a rotated "Pokémon · One Piece · Graded" label.
- `MiniBanners.tsx` — 3 static image tiles linking to category pages, using
  `/banners/mini/{graded-pokemon-english,graded-pokemon-japanese,graded-one-piece}.png`.
- `ProductGrid.tsx` — paginated "All Products" grid with category + sort
  selects. Also used by `CategoryPage`.
- Data hooks: `useCategoriesQuery()` → `Category[]`;
  `useProductsQuery({ category, page, ordering })` → `Paginated<Product>`.
- `ProductCard.tsx` — existing card; reused as-is.

## Target Layout

```
┌─────────────────────────────────────────────────────────────┐
│ HERO (full-bleed, edge-to-edge)                              │
│                                                             │
│  PREMIUM TCG STORE              ┌───────────────────────┐    │
│  CATCH                          │  rotating category    │    │
│  EVERY                          │  image (auto-cycle,   │    │
│  CARD.                          │  crossfade, 1 at a    │    │
│                                 │  time)                │    │
│  [ Btn1 ] [ Btn2 ] [ Btn3 ]     └───────────────────────┘    │
│   (controls + tabs for the showcase)                        │
└─────────────────────────────────────────────────────────────┘

  ── Category 1 title ──────────────────────  [ View all → ]
  [card] [card] [card] [card] [card] ...  →  (horizontal scroll)

  ── Category 2 title ──────────────────────  [ View all → ]
  [card] [card] [card] [card] [card] ...  →

  ── Category 3 title ──────────────────────  [ View all → ]
  [card] [card] [card] [card] [card] ...  →
```

## Components

### `Hero.tsx` (rework)

Full-bleed (no `max-w-7xl` wrapper, no outer rounded card; spans viewport
width). Inner content may still be constrained to a max width and centered for
readability, but the background art runs edge to edge. Existing red theme,
geometric clip-path art, and the "CATCH EVERY CARD" headline are kept.

Reads `useCategoriesQuery()`. A module-level `slug → image` map provides the
showcase artwork (reusing the existing `/banners/mini/*.png`). A category with
no mapped image falls back to a gradient placeholder.

**Rotating image showcase** (right side):
- Auto-cycles through the categories' images, one at a time, ~4s interval, with
  a crossfade transition.
- Pauses while the user hovers any category button.

**Category buttons** (overlaid, act as the showcase's controls/tabs):
- Hovering a button previews that category's image and highlights the button
  (and pauses auto-rotation).
- Clicking a button smooth-scrolls to that category's section below
  (`document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })`).
- Clicking the currently-active showcase image scrolls to the active
  category's section.

The previous standalone "SHOP NOW" button and the rotated
"Pokémon · One Piece · Graded" label are removed — the category buttons now own
navigation.

Section ids are derived deterministically from slug (e.g. `category-${slug}`)
so Hero and the sections agree without prop drilling.

### `CategorySection.tsx` (new)

Props: `{ category: Category }`. One per category.

- Wrapper has `id={`category-${category.slug}`}` and `scroll-mt-*` so the hero's
  smooth-scroll lands cleanly below the navbar.
- **Header row:** category name + a product-count badge on the left;
  a "View all →" `<Link to={`/category/${category.slug}`}>` on the right.
- **Body:** fetches products via
  `useProductsQuery({ category: category.slug })` and renders up to **12**
  `ProductCard`s in a horizontally-scrollable row.
- **Horizontal scroll:** native CSS scroll-snap (`overflow-x-auto`,
  `snap-x`, snap-align on items, hidden scrollbar). On desktop, left/right
  arrow buttons (shown on hover) scroll the row by roughly one viewport of
  cards via `scrollBy`. Touch devices use native swipe. No new dependency.
- **States:** loading → a row of skeleton cards (reuse `ui/skeleton`);
  empty (no products) → the section renders nothing (return `null`) so empty
  categories don't leave dead headers.

### `Home.tsx` (rework)

```
<Hero />
{categories.map((c) => <CategorySection key={c.id} category={c} />)}
```

Uses `useCategoriesQuery()` for the list. While categories are loading, show a
lightweight placeholder; on error, render the hero alone.

### Removals

- `MiniBanners.tsx` — deleted; its imagery moves into the hero showcase.
- The standalone "All Products" `ProductGrid` is removed **from the home page**
  only. `ProductGrid` itself stays (still used by `CategoryPage`).

## Data Flow

- `Home` → `useCategoriesQuery()` → renders N `CategorySection`s.
- Each `CategorySection` → `useProductsQuery({ category: slug })`, slices to 12.
- `Hero` → `useCategoriesQuery()` (same cached query) for buttons + image map.
- No backend changes. No new API endpoints. `ProductViewSet` already filters by
  `?category=<slug>` and returns only in-stock products.

## Edge Cases

- **Category with 0 in-stock products:** section returns `null` (no empty
  header).
- **Category missing a mapped hero image:** gradient placeholder in the
  showcase; button still works.
- **More than 3 categories:** layout is a `.map`, so it scales; the hero
  showcase cycles through all of them. Designed and verified against the
  current 3.
- **Reduced motion:** respect `prefers-reduced-motion` — disable the
  auto-rotation/crossfade and just show the first (or hovered) image.

## Testing

Vitest (unit), following existing patterns (mock `@/config/axios`, wrap in a
fresh `QueryClientProvider`):

- `CategorySection.test.tsx` — renders header + "View all" link to
  `/category/:slug`; renders up to 12 cards; caps at 12 when more are returned;
  returns nothing when the category has no products; shows skeletons while
  loading.
- `Hero.test.tsx` — renders a button per category; hovering a button highlights
  it / swaps the active image; clicking a button calls `scrollIntoView` on the
  matching section id. (Stub `scrollIntoView`.)
- Remove/replace `MiniBanners` references; ensure no test imports the deleted
  component.

No new Playwright specs required (no new cross-page contract); the existing
`category-filter` / browse specs still cover navigation to category pages.

## Out of Scope

- Backend / API changes.
- Redesign of `ProductCard`, `CategoryPage`, or the navbar.
- Adding a carousel/slider library (native scroll-snap only).
