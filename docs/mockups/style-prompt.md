# Shared Mockup & Illustration Style Prompt

> Clean mobile-first web app UI for young children, flat vector illustration style, soft rounded corners, generous whitespace, large friendly sans-serif type, warm pastel palette of cream background with teal and coral accents, no gradients, no drop shadows, no clutter, calm and uncluttered rather than busy or arcade-like.

## Review & Layout Decisions (Tasks 1.9–1.10)

Reviewed at mobile portrait width (375×812 CSS px):

1. **Screen 4 (Writing session — Image vs. Letter Bank spacing)**:
   - Constraint: On 375px-wide viewports, the word illustration container is capped at `max-height: 180px` (`h-44`) with compact vertical padding so the letter boxes and 2-row alphabetical letter bank never crowd the illustration or require vertical scrolling.
2. **Screen 4 & 5 (Tappable Letter Tiles)**:
   - Every tile in `AlphabetKeyboard` is enforced at minimum `52×52px` (`min-w-[52px] min-h-[52px]`, exceeding the 48×48px minimum) with `10px` (`gap-2.5`) spacing between tiles.
3. **Screen 6 (Celebration Screen — Equal Weight Buttons)**:
   - Both `"One more round"` and `"All done"` buttons use identical height, border weight, typography, and neutral/warm styling (`bg-white border-2 border-teal-700 text-teal-900`) so neither reads as the pre-selected default action.

