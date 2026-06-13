---
name: Gourmet Flux
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#5a4136'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#8e7164'
  outline-variant: '#e2bfb0'
  surface-tint: '#a04100'
  primary: '#a04100'
  on-primary: '#ffffff'
  primary-container: '#ff6b00'
  on-primary-container: '#572000'
  inverse-primary: '#ffb693'
  secondary: '#5f5e5e'
  on-secondary: '#ffffff'
  secondary-container: '#e2dfde'
  on-secondary-container: '#636262'
  tertiary: '#a23f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#fd6c19'
  on-tertiary-container: '#581f00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#ffdbcd'
  tertiary-fixed-dim: '#ffb595'
  on-tertiary-fixed: '#360f00'
  on-tertiary-fixed-variant: '#7c2e00'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  touch-target-min: 48px
  container-padding: 20px
---

## Brand & Style

The design system is engineered to bridge the gap between high-end culinary excellence and rapid digital efficiency. It targets urban professionals and food enthusiasts who value both their time and the quality of their dining experiences. The emotional core of the UI is "Professional Warmth"—it feels as reliable as a Michelin-star maître d' and as welcoming as a local bistro.

The design style follows a **Modern Corporate** aesthetic with a **Tactile** edge. It leverages generous white space and high-definition food photography to stimulate appetite, while using structural precision and large touch targets to ensure the PWA feels robust and dependable on mobile devices.

## Colors

The color palette is anchored by **Vibrant Orange**, chosen specifically for its psychological association with appetite stimulation and energy. This is balanced by **Deep Charcoal**, which provides the "premium" weight necessary to ground the experience and suggest high-quality service.

The background uses a soft **Off-white** to reduce eye strain and provide a clean canvas that makes food imagery pop. Use the primary color for calls-to-action and key brand moments, while reserving charcoal for typography and structural elements like navigation bars and headers.

## Typography

This design system utilizes a dual-font strategy to balance character with functionality. **Plus Jakarta Sans** is used for headlines; its slightly rounded, modern geometric terminals evoke a friendly and appetizing feel. 

For functional text and long-form descriptions, **Inter** provides maximum legibility at various scales, ensuring that menu details and prices are easily scannable. All price points should be rendered in Inter Semi-bold to ensure they are immediately visible.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model optimized for PWA mobile-first usage. A standard 4-column grid is used for mobile, expanding to 12 columns for tablet and desktop views. 

Spacing follows an 8px rhythmic scale. To ensure the "efficient" brand promise, horizontal margins are kept consistent at 20px, while vertical rhythm is more generous (24px - 32px) to allow the interface to breathe and highlight premium imagery. All interactive elements must adhere to a minimum 48px touch target height to ensure error-free navigation during on-the-go usage.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. Instead of harsh black shadows, this design system uses soft, diffused shadows with a slight tint of the secondary color (#1A1A1A) at very low opacity (5-8%). 

Elements like "Book Now" floating buttons or active food cards use a "Lifted" state (8px blur, 4px Y-offset) to indicate interactability. Secondary containers, such as menu categories, use a subtle 1px border in a light grey to define boundaries without adding visual weight.

## Shapes

The shape language is defined by a consistent **16px radius (rounded-lg)** for all major components including cards, buttons, and input fields. This high degree of roundedness reinforces the "friendly" and "modern" brand attributes. 

Images of food should always feature rounded corners to match the UI, creating a cohesive visual flow. Circular treatments (pill-shapes) are reserved specifically for status chips and tags to differentiate them from actionable buttons.

## Components

### Buttons
Primary buttons use the Vibrant Orange background with white text, featuring a subtle inner glow to simulate a tactile surface. Secondary buttons use a Deep Charcoal outline with a 16px radius.

### Cards
Food items are presented in "Appetite Cards." These feature a full-bleed top image, 16px corner radius, and a subtle drop shadow. Information (name, price) is placed in a white area below the image with generous 16px padding.

### Chips & Tags
Used for dietary requirements (e.g., "Vegan", "Gluten-Free"). These are pill-shaped with a light grey background and Deep Charcoal text to ensure they don't compete with the primary orange CTAs.

### Input Fields
Forms use a soft off-white fill with a 16px radius. On focus, the border transitions to a 2px Vibrant Orange stroke to provide clear feedback.

### Navigation
The PWA uses a bottom navigation bar for easy thumb access. Icons should be 24px, linear, and stroke-based, turning solid Orange when active.

### Specialized Components
- **The "Quick Reserve" Drawer:** A bottom-sheet component that slides up, allowing users to pick a time and party size without leaving the menu.
- **Availability Indicators:** Small, pulsing green dots next to restaurant names to signify "Table Available Now."