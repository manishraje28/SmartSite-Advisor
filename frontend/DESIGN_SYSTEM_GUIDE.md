# SmartSite Design System - Component Usage Guide

## 🎨 Color Palette

All colors are available via Tailwind CSS with the `smartsite-` prefix:

```jsx
{/* Background Colors */}
<div className="bg-smartsite-primary">Soft Beige (Main BG)</div>
<div className="bg-smartsite-secondary">Warm Yellow (Cards)</div>
<div className="bg-smartsite-accent">Orange (CTAs)</div>
<div className="bg-smartsite-emphasis">Golden Brown (Emphasis)</div>

{/* Text Colors */}
<p className="text-smartsite-dark">Dark Brown (Headings)</p>
<p className="text-smartsite-text">Medium Brown (Body)</p>
<p className="text-smartsite-muted">Muted Brown (Captions)</p>

{/* Status Colors */}
<div className="bg-smartsite-success">Success (Green)</div>
<div className="bg-smartsite-danger">Danger (Red)</div>
```

---

## 🔘 Button Component

### Variants

```jsx
import Button from './components/common/Button';

// Primary (Orange - CTA)
<Button variant="primary">Get Started</Button>

// Secondary (Outlined)
<Button variant="secondary">Learn More</Button>

// Tertiary (Subtle/Ghost)
<Button variant="tertiary">Help</Button>

// Danger
<Button variant="danger">Delete</Button>
```

### Sizes

```jsx
<Button size="sm">Small</Button>
<Button size="md">Medium (default)</Button>
<Button size="lg">Large</Button>
```

### States

```jsx
<Button disabled>Disabled</Button>
<Button className="w-full">Full Width</Button>
```

---

## 📦 Card Component

### Variants

```jsx
import Card from './components/common/Card';

// Default (warm yellow background)
<Card>Standard card</Card>

// Large (more padding)
<Card variant="large">Large card with more padding</Card>

// Gradient Accent (special highlight)
<Card variant="accent">Highlighted card with gradient</Card>

// Flat (minimal styling)
<Card variant="flat">Flat variant</Card>
```

### With Content

```jsx
<Card>
  <h3 className="font-bold text-smartsite-dark mb-2">Title</h3>
  <p className="text-smartsite-text">Description</p>
</Card>
```

---

## 🔤 Input Component

```jsx
import Input from './components/common/Input';

// Basic
<Input placeholder="Enter text..." />

// With Label
<Input label="Email" type="email" placeholder="you@example.com" />

// With Error
<Input label="Password" error="Password is required" />

// With Helper Text
<Input label="Username" helperText="3-20 characters" />

// Disabled
<Input disabled value="Read-only" />
```

---

## 🏷️ Badge Component

### Variants

```jsx
import Badge from './components/common/Badge';

<Badge variant="primary">Primary</Badge>
<Badge variant="accent">Accent (Orange)</Badge>
<Badge variant="emphasis">Emphasis (Brown)</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="danger">Danger</Badge>
```

### With Icons

```jsx
<Badge variant="accent" icon="🏆">Best Choice</Badge>
<Badge variant="success" icon="✓">Completed</Badge>
```

---

##🎯 Section Components

### HeroSection

```jsx
import HeroSection from './components/sections/HeroSection';

<HeroSection
  title="Make Smarter Property Decisions with AI"
  subtitle="AI-powered recommendations tailored to your preferences."
  ctaText="Get Started"
  ctaLink="/register"
  secondaryCtaText="Learn More"
  secondaryCtaLink="#about"
/>
```

### FeatureCard

```jsx
import FeatureCard from './components/sections/FeatureCard';

<FeatureCard
  icon="🎯"
  title="AI Recommendations"
  description="Get personalized recommendations"
  highlighted={false}
/>
```

### MetricCard

```jsx
import MetricCard from './components/sections/MetricCard';

<MetricCard
  label="Property Score"
  value="92/100"
  icon="⭐"
  indicator="positive"
  indicatorText="+8% from last month"
/>
```

### RecommendationCard

```jsx
import RecommendationCard from './components/sections/RecommendationCard';

<RecommendationCard
  property={{
    title: "Modern 3BHK Apartment",
    location: { address: "Bandra, Mumbai" },
    price: 9500000
  }}
  score={92}
  reasons={[
    "Perfect price point",
    "Excellent location",
    "Strong ROI potential"
  ]}
  onViewDetails={() => {}}
  onCompare={() => {}}
/>
```

---

## 🧩 Layout Components

### Navbar

```jsx
import Navbar from './components/layout/Navbar';

// Automatically renders with authentication-aware menus
<Navbar />
```

---

## 📐 Typography Classes

```jsx
{/* Headings */}
<h1>48px Bold - Hero Title</h1>
<h2>32px Bold - Section Title</h2>
<h3>24px Bold - Subsection</h3>
<h4>18px Bold - Card Title</h4>
<h5>14px Bold - Label</h5>

{/* Body Text */}
<p className="text-body">Standard body text (14px)</p>
<p className="text-body-sm">Smaller body text (12px)</p>
<p className="text-caption">Caption text (11px)</p>
```

---

## 🎨 Grid Layouts

### Auto-Grid (3 columns on desktop)

```jsx
<div className="grid-cols-cards">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

### Property Grid (4 columns on desktop)

```jsx
<div className="property-grid">
  {/* Property cards auto-fill */}
</div>
```

### Comparison Grid

```jsx
<div className="comparison-grid">
  {/* Comparison cards */}
</div>
```

---

## 🎓 Utility Classes

### Spacing

```jsx
{/* Margin & Padding */}
<div className="p-lg m-xl">Padding + Margin</div>

{/* Standard spacing shorthand */}
<div className="mb-6">Margin bottom</div>
<div className="px-4">Padding X-axis</div>
```

### Flexbox

```jsx
<div className="flex-center">Centered flex</div>
<div className="flex items-center justify-between">Custom flex</div>
```

### Containers

```jsx
{/* Full-width with padding */}
<div className="container-wide">Wide container</div>

{/* Narrower container */}
<div className="container-base">Base container</div>
```

### Shadows

```jsx
<div className="shadow-xs">Subtle shadow</div>
<div className="shadow-sm">Soft shadow</div>
<div className="shadow-md">Medium shadow</div>
<div className="shadow-lg">Large shadow</div>
<div className="shadow-accent">Orange accent shadow</div>
```

### Gradients

```jsx
<div className="gradient-hero">Hero gradient</div>
<div className="gradient-accent">Accent gradient</div>
```

### Text Truncation

```jsx
<p className="line-clamp-1">Single line ellipsis</p>
<p className="line-clamp-2">Two lines max</p>
<p className="line-clamp-3">Three lines max</p>
```

---

## 🔄 Animations & Transitions

All elements have smooth transitions by default (0.3s, cubic-bezier).

```jsx
{/* Fade in animation */}
<div className="animate-fade-in">Fades in on mount</div>

{/* Hover effects */}
<Card>Lifts on hover (-4px)</Card>
<Button>Lifts on hover (-2px)</Button>
```

---

## 📱 Responsive Design

### Responsive Grid Classes

```jsx
{/* 1 column mobile, 2 tablet, 3 desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</div>
```

### Responsive Typography

```jsx
<h1>Automatically scales on mobile</h1>
<div className="px-4 sm:px-6 lg:px-8">Responsive padding</div>
```

---

## 🎯 Best Practices

1. **Always use the smartsite color palette** - never hardcode colors
2. **Use predefined spacing scale** - xs, sm, md, lg, xl, 2xl, 3xl, 4xl
3. **Leverage card-base for consistent styling** - use Card component
4. **Use container-wide/container-base** for layout structure
5. **Apply proper typography hierarchy** - h1 for titles, h2 for sections, body for content
6. **Use grid-cols-cards for product grids** - auto-responsive
7. **Keep shadows subtle** - use shadow-sm or shadow-md
8. **Test on mobile** - the design is fully responsive

---

## 📚 Example Page

```jsx
import HeroSection from './components/sections/HeroSection';
import FeatureCard from './components/sections/FeatureCard';
import Card from './components/common/Card';
import Button from './components/common/Button';

export default function ExamplePage() {
  return (
    <div className="bg-smartsite-primary min-h-screen">
      <HeroSection
        title="Welcome to SmartSite"
        subtitle="Make smarter decisions with AI"
        ctaText="Get Started"
      />

      <div className="container-wide mb-20">
        <h2 className="text-smartsite-dark mb-12 text-center">Features</h2>
        <div className="grid-cols-cards">
          <FeatureCard icon="🎯" title="AI Powered" description="Smart recommendations" />
          <FeatureCard icon="📊" title="Analytics" description="Data-driven insights" />
          <FeatureCard icon="⚡" title="Fast" description="Quick decisions" highlighted />
        </div>
      </div>

      <div className="container-wide">
        <Card variant="large" className="text-center p-12">
          <h3 className="text-smartsite-dark mb-4">Ready to start?</h3>
          <Button variant="primary">Sign Up Now</Button>
        </Card>
      </div>
    </div>
  );
}
```

---

Generated for SmartSite using premium design system 🎨
