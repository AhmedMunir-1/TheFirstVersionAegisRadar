
# Add Smooth Scroll Animations with Framer Motion

## Overview

This plan adds polished scroll-triggered animations to the AegisRadar landing page using Framer Motion. When users scroll down, sections will smoothly fade in, slide up, and elements will animate in sequence for a professional, modern feel.

## What You'll Get

- **Section headers** fade and slide up as they enter the viewport
- **Feature cards** animate in one-by-one with a staggered delay
- **Pricing cards** scale up elegantly when scrolled into view
- **How It Works steps** slide in from the left sequentially
- **Dashboard preview** fades in with a subtle scale effect
- **CTA section** animates to draw attention

## Implementation Steps

### 1. Install Framer Motion

Add the `framer-motion` package to the project dependencies.

### 2. Create a Reusable Animation Component

Create a new `ScrollReveal` component that wraps content and triggers animations when it enters the viewport. This keeps the code clean and reusable.

```text
src/components/ui/scroll-reveal.tsx

Features:
- Uses Framer Motion's useInView hook
- Configurable animation variants (fade-up, fade-left, fade-right, scale)
- Adjustable delay for staggered effects
- "once" option to animate only on first scroll
```

### 3. Update Landing Page Components

**Hero.tsx**
- Wrap badge, headline, subheadline, buttons, and stats with motion elements
- Add staggered delays for cascading entrance effect
- Keep existing animations but enhance with Framer Motion

**Features.tsx**
- Animate section header on scroll
- Stagger feature cards with increasing delays (0.1s, 0.2s, 0.3s, etc.)
- Add subtle scale effect on cards

**HowItWorks.tsx**
- Animate each step with slide-from-left effect
- Stagger steps sequentially for a step-by-step reveal

**Pricing.tsx**
- Animate section header
- Stagger pricing cards with scale-up animation
- Add extra emphasis to the "Most Popular" card

**DashboardPreview.tsx**
- Fade in the entire dashboard mock with scale effect
- Animate stats grid items individually
- Animate chart bars with staggered delays

**CTA.tsx**
- Fade up the icon, headline, and buttons
- Add subtle bounce effect to draw attention

### 4. Animation Configuration

```text
Animation variants:
  - fadeUp: opacity 0->1, y 40->0
  - fadeLeft: opacity 0->1, x -40->0
  - fadeRight: opacity 0->1, x 40->0
  - scaleUp: opacity 0->1, scale 0.9->1
  - stagger: parent orchestrates children delays

Timing:
  - Duration: 0.5-0.7s
  - Easing: easeOut
  - Viewport threshold: 0.2 (20% visible triggers animation)
```

## Technical Details

### New File Structure

```text
src/
  components/
    ui/
      scroll-reveal.tsx  (NEW - reusable animation wrapper)
    landing/
      Hero.tsx           (MODIFIED - add motion elements)
      Features.tsx       (MODIFIED - add staggered card animations)
      HowItWorks.tsx     (MODIFIED - add step animations)
      Pricing.tsx        (MODIFIED - add card animations)
      DashboardPreview.tsx (MODIFIED - add reveal animations)
      CTA.tsx            (MODIFIED - add attention-grabbing animation)
```

### ScrollReveal Component API

```typescript
// Usage example:
<ScrollReveal variant="fadeUp" delay={0.2}>
  <FeatureCard />
</ScrollReveal>

// For staggered children:
<ScrollReveal variant="stagger">
  {items.map((item, i) => (
    <ScrollReveal key={i} variant="fadeUp" delay={i * 0.1}>
      <Item />
    </ScrollReveal>
  ))}
</ScrollReveal>
```

### Performance Considerations

- Use `once: true` so elements only animate on first scroll (prevents re-triggering)
- Animations use CSS transforms (GPU-accelerated)
- Viewport margin set to trigger slightly before elements fully enter view

## Summary of Changes

| File | Changes |
|------|---------|
| `package.json` | Add `framer-motion` dependency |
| `scroll-reveal.tsx` | New reusable animation component |
| `Hero.tsx` | Wrap elements with motion components |
| `Features.tsx` | Add staggered card animations |
| `HowItWorks.tsx` | Add sequential step reveals |
| `Pricing.tsx` | Add scaling card animations |
| `DashboardPreview.tsx` | Add dashboard reveal animation |
| `CTA.tsx` | Add attention-focused animations |
