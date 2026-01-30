# Banner Component Usage

The `Banner` component is a reusable hero banner for showcasing featured content, categories, or promotions.

## Basic Usage

```jsx
import Banner from '../components/Banner'

<Banner
  image="/banners/my-banner.png"
  title="Shop All Collections"
  subtitle="Explore our premium selection"
  buttonText="Shop Now"
  buttonLink="/"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `image` | string | ✓ | - | Path to the banner image (relative to public folder) |
| `title` | string | | - | Main heading text |
| `subtitle` | string | | - | Subheading text |
| `buttonText` | string | | - | Text for the CTA button |
| `buttonLink` | string | | - | URL for the button (can be internal or external) |
| `height` | string | | `'h-[500px]'` | Tailwind height class |
| `textPosition` | string | | `'center'` | Text alignment: `'left'`, `'center'`, or `'right'` |
| `overlay` | string | | `'medium'` | Overlay darkness: `'none'`, `'light'`, `'medium'`, or `'dark'` |

## Examples

### Full-Width Hero Banner
```jsx
<Banner
  image="/banners/hero.png"
  title="Shop All Collections"
  subtitle="Explore our premium selection of Pokemon cards"
  buttonText="Shop Now"
  buttonLink="/"
  height="h-[400px] md:h-[500px] lg:h-[600px]"
  textPosition="center"
  overlay="medium"
/>
```

### Category Banner (Left-Aligned)
```jsx
<Banner
  image="/banners/funko-pops.png"
  title="Funko Pops"
  subtitle="Collectible vinyl figures"
  buttonText="Browse Funko Pops"
  buttonLink="/category/funko-pops"
  height="h-[300px]"
  textPosition="left"
  overlay="dark"
/>
```

### Simple Image Banner (No Text)
```jsx
<Banner
  image="/banners/promo.png"
  buttonText="Shop Sale"
  buttonLink="/category/on-sale"
  height="h-[250px]"
  overlay="light"
/>
```

### Multiple Banners Layout
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
  <Banner
    image="/banners/trading-cards.png"
    title="Trading Cards"
    buttonText="Browse Cards"
    buttonLink="/category/trading-cards"
    height="h-[300px]"
    textPosition="center"
    overlay="medium"
  />
  <Banner
    image="/banners/funko-pops.png"
    title="Funko Pops"
    buttonText="Browse Pops"
    buttonLink="/category/funko-pops"
    height="h-[300px]"
    textPosition="center"
    overlay="medium"
  />
</div>
```

## Best Practices

1. **Image Dimensions**: Use high-quality images (at least 1920x600px for full-width banners)
2. **File Size**: Optimize images (use WebP format if possible) to keep file sizes under 500KB
3. **Overlay**: Use darker overlays when text needs better contrast
4. **Text Length**: Keep titles short (3-5 words) for better readability
5. **Button Clarity**: Use clear, action-oriented button text ("Shop Now", "Browse", "Explore")
6. **Responsive Heights**: Use responsive height classes for mobile (e.g., `h-[300px] md:h-[400px] lg:h-[500px]`)

## Image Location

Place banner images in:
```
frontend/public/banners/
  ├── all-collections.png
  ├── trading-cards.png
  ├── funko-pops.png
  └── promo.png
```

Images in the `public` folder are accessible via `/banners/image-name.png` in production.
