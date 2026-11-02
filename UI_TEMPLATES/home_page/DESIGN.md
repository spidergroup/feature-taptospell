---
name: Playful Educational Game System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d0daf1'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d9e3f9'
  on-surface: '#121c2c'
  on-surface-variant: '#514532'
  inverse-surface: '#273142'
  inverse-on-surface: '#ecf1ff'
  outline: '#837560'
  outline-variant: '#d5c4ab'
  surface-tint: '#7c5800'
  primary: '#7c5800'
  on-primary: '#ffffff'
  primary-container: '#ffb800'
  on-primary-container: '#6b4c00'
  inverse-primary: '#ffba20'
  secondary: '#006399'
  on-secondary: '#ffffff'
  secondary-container: '#04a8ff'
  on-secondary-container: '#003a5d'
  tertiary: '#7825ea'
  on-tertiary: '#ffffff'
  tertiary-container: '#d3b9ff'
  on-tertiary-container: '#6b00dd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdea8'
  primary-fixed-dim: '#ffba20'
  on-primary-fixed: '#271900'
  on-primary-fixed-variant: '#5e4200'
  secondary-fixed: '#cde5ff'
  secondary-fixed-dim: '#95ccff'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#004a75'
  tertiary-fixed: '#ebdcff'
  tertiary-fixed-dim: '#d4bbff'
  on-tertiary-fixed: '#270058'
  on-tertiary-fixed-variant: '#5d00c2'
  background: '#f9f9ff'
  on-background: '#121c2c'
  surface-variant: '#d9e3f9'
typography:
  headline-xl:
    fontFamily: Rubik
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
  headline-xl-mobile:
    fontFamily: Rubik
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 42px
  headline-lg:
    fontFamily: Rubik
    fontSize: 36px
    fontWeight: '800'
    lineHeight: 44px
  headline-lg-mobile:
    fontFamily: Rubik
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
  headline-md:
    fontFamily: Rubik
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-sm:
    fontFamily: Rubik
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 30px
  body-lg:
    fontFamily: Nunito Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 30px
  body-md:
    fontFamily: Nunito Sans
    fontSize: 17px
    fontWeight: '600'
    lineHeight: 26px
  body-sm:
    fontFamily: Nunito Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
  label-lg:
    fontFamily: Rubik
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  label-md:
    fontFamily: Rubik
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  label-sm:
    fontFamily: Rubik
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 18px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.25rem
  margin: 1.5rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 2rem
  space-xl: 3rem
---

## Brand & Style

This design system is tailored for interactive, joyful early-learning web experiences. Its personality is exuberantly optimistic, physically tactile, encouraging, and clear. The interface serves young children (ages 4–9) alongside guiding parents and educators, prioritizing intuitive visual cues over heavy text. 

The aesthetic synthesizes **Tactile Toy Skeuomorphism** with **Modern Soft Bubbly UI**:
- Surfaces resemble smooth, rounded physical toys and arcade components.
- Buttons invite physical interaction through chunky push-states, extruded lower bevels, and animated squishes.
- Motifs incorporate rounded stars, buoyant badge shields, and bouncy motion choreographies.
- Visual clarity ensures young learners never feel stuck, anxious, or overwhelmed by cognitive friction.

## Colors

The palette relies on saturated, sunny primaries complemented by rich jewel accents to signal actions, progress, and immediate feedback:

- **Primary Sun Gold (`#FFB800`)**: Core brand anchor, primary action accents, coin counters, and celebratory starbursts. Paired with extruded drop-shadow tone `#D97706`.
- **Secondary Sky Splash (`#00A8FF`)**: Informational containers, water-themed puzzle tracks, secondary interactive triggers, and navigational pills. Extruded shadow tone `#0284C7`.
- **Tertiary Berry Purple (`#8A3FFC`)**: Magic states, special rewards, level-up milestones, and creative zones. Extruded shadow tone `#6929C4`.
- **Energy Orange (`#FF5722`)**: Attention-grabbing start triggers, playful callouts, and interactive countdown badges. Extruded shadow tone `#D84315`.
- **Success Clover (`#10B981`)**: Correct answers, complete quests, and positive reinforcement. Extruded shadow tone `#047857`.
- **Gentle Coral Red (`#FF4D6D`)**: Try-again states, lives lost, and reset toggles, styled softly without harsh punitive connotations. Extruded shadow tone `#E11D48`.
- **Neutral Canvas & Dark Midnight (`#FFFBEB` background, `#273142` ink)**: High-contrast, friendly rounded ink for maximal legibility without pure black starkness.

## Typography

Typography prioritizes open letterforms, heavy weights, and high stroke clarity to empower emergent and early readers:

- **Display & Headings (Rubik)**: Thick, rounded, soft terminal strokes that prevent harsh intersections while delivering arcade-like punch. Heavy weights (700 and 800) maintain visual authority alongside colorful graphic illustrations.
- **Body & Prompts (Nunito Sans)**: Humanist, open-aperture sans-serif configured in bold weights (`600` and `700`) to guarantee effortless legibility even on low-cost tablet screens.
- **Labels & Badges (Rubik)**: High-impact, tracked-out title case for gamified counters, score plaques, and audio captions.
- Every text element enforces high-contrast ratios against its immediate backdrop (exceeding WCAG AAA where possible).

## Layout & Spacing

Interactive surfaces require expansive finger-friendly room to avoid accidental clicks from developing motor skills:

- **Layout Grid**: 12-column adaptive fluid canvas bound within a max-width of `1200px` for desktop and landscape tablet orientations. Portrait tablets and phones adapt to 4-to-6 columns with generous edge gutters (`1.5rem`).
- **Touch Target Integrity**: All tap-capable buttons and interactive canvas triggers maintain a minimum dimensional hit area of `56px × 56px` (`64px × 64px` for primary navigation triggers).
- **Rhythm & Padding**: Component spacing operates in a 4px/8px modular rhythm, favoring loose spacing (`space-md` through `space-xl`) between game cards to maintain distinct visual separation.

## Elevation & Depth

This design system avoids blurry realistic lighting in favor of **Toy-Box Physicality** using multi-tone extruded offsets and crisp solid shadows:

- **The 3D Push-Button Extrusion**: Interactive objects sit elevated above their baseline using a solid border-bottom or offset shadow (e.g., `box-shadow: 0 6px 0 0 [Darker_Shade]`). When pressed, elements translate down 4px (`transform: translateY(4px)`) and the offset shrinks to `0 2px 0 0`, simulating a mechanical arcade switch.
- **Card Floating Surfaces**: Game cards sit with a soft, warm ambient drop (`0 10px 25px -4px rgba(39, 49, 66, 0.08)`) combined with a crisp 3px stroke outline (`#E5E7EB` or a matching tinted pastel) to ground each object firmly on the creamy canvas.
- **Celebration Layer**: Floating star overlays and modal awards utilize high-intensity ambient rings (`0 0 30px rgba(255, 184, 0, 0.45)`) combined with sharp solid shadows to communicate top-tier interactive z-indexes.

## Shapes

The shape system is unapologetically bubbly, friendly, and soft. Sharp edges are fully avoided to maintain safety, playfulness, and organic toy-like appeal:

- Standard buttons, badges, status pills, and counter tracks use full pill radii (`rounded-full` / `9999px`).
- Game cards, modal dialogs, and activity containers use large, friendly curvatures (`rounded-3xl` / `1.75rem` to `2.25rem`).
- Illustrated cutouts, progress bars, and framed avatars feature bubble-corner treatments with thick, expressive stroke borders (3px to 4px).

## Components

### Tactile Game Buttons
- Built with an inner glossy pill highlight and a solid 5px to 8px extruded base shadow matching the darker tone of the hue.
- Feature large chunky typography and optional left-aligned oversized iconography (stars, sound icons, play arrows).
- Active state translates the element vertically (`translateY(4px)`) with instant auditory click sound effects.

### Bubbly Cards
- Thick 3px white or soft-tinted borders set against cheerful pastel fills (`#FEF3C7` for challenges, `#E0F2FE` for science/reading).
- Elevated with smooth 12px bottom pill extrusions.
- Include a floating upper badge (e.g., star count or difficulty trophy) breaking the top container boundary.

### Progress & Streak Tracks
- Thick, pill-shaped progress bars with candy-striped fills or animated liquid gradients.
- Node milestones represented as oversized circular collectible tokens that pop open with confetti bursts on completion.

### Badges & Star Motifs
- 5-point rounded stars with cute expressive eye highlights for streak indicators.
- Ribbon-shaped banner plaques supporting game titles and celebratory modal headers.

### Form Inputs & Selection Chips
- Single-tap radio cards designed as giant chunky tiles with clear visual tick badges rather than tiny checkboxes.
- Inputs display 3px rounded border states, soft cream backgrounds, and extra-large placeholder hints for young typists.

### Audio & Help Controls
- Prominently positioned, sticky, floating circular buttons housing a high-contrast speakerphone icon to read questions aloud on demand.