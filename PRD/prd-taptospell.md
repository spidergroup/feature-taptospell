# PRD: TapToSpell

**Status:** Draft for approval (revision 2)
**Date:** 2026-11-01 (revision 1: 2026-10-30)
**Target launch:** Monday, January 4, 2027
**Author:** Johnny

### Revision 2 summary

| # | Change | Where |
| --- | --- | --- |
| 1 | New home page built from `UI_TEMPLATES/home_page` | 4.1, 6.1 |
| 2 | Spelling game page built from `UI_TEMPLATES/kids_spelling_word_game` | 4.2, 6.1 |
| 3 | Practice link is created automatically when the parent taps a game on the home page; no slug-choice screen | 4.1 |
| 4 | Grade, points, level and progress are stored locally first, then synced to the server so any device sees the same state | 4.7 |
| 5 | Version 1.0 ships **spelling mode only**. Reading mode is kept in this document, marked for version 2.0 | 4.12 |
| 6 | Spelling mode has 5 levels, configured in a JSON file | 4.3 |
| 7 | A correct answer fires canvas-confetti for 3 seconds, then moves to the next word | 4.5 |
| 8 | Light-bulb hints: word length − 1 bulbs, each reveals one random letter | 4.4 |

"Writing mode" from revision 1 is renamed **spelling mode** throughout.

---

## 1. Introduction / Overview

TapToSpell is a free web app that lets children aged 5–8 practise spelling without downloading anything or creating an account. Version 1.0 ships spelling mode only; reading practice follows in version 2.0.

**The problem.** A parent whose child has twenty spelling words due Friday cannot get that child practising in under two minutes. Every good option in this space demands an app-store download, an account, or a free-trial signup before the first word appears. Khan Academy Kids is excellent and free but app-only. ABCmouse puts a subscription wall in front of a parent who wants twenty words, not a ten-subject curriculum. Printable worksheets work but give no feedback and keep no record.

**The goal.** Remove every step between a parent deciding to help and a child practising. A parent visits the site, picks a grade, and taps the Spelling game. A practice link is created automatically and the game opens. The parent shares that link with the child's device. The child opens the link and practice begins immediately — no login, no install, no interstitial.

**What we are testing.** Whether removing that friction is enough on its own to make children return weekly, and whether parents will later pay for progress tracking. We are not trying to teach better than anyone else. We are competing purely on time-to-first-word.

---

## 2. Goals

1. A child can go from receiving a link to answering the first word in under 10 seconds, with zero taps beyond opening the link.
2. 60% of started practice sessions reach the final word, measured 4 weeks after launch.
3. 25% of practice links show activity again 8–14 days after first use, measured 6 weeks after launch.
4. Collect no personal information from any child, anywhere in the product.
5. Keep running costs at $0/month until the product exceeds roughly 3,300 monthly active users.
6. Ship the version 1.0 feature set described here within the 70 developer-hour budget plus the revision 2 rework estimated in `tasks-taptospell.md`.

---

## 3. User Stories

**As a parent of a 2nd grader**, I want to tap one game on the home page and get a link straight away, so that I can send it to my daughter's tablet while I make dinner.

**As a parent**, I want to see which words my child has mastered, their stars and their level, without creating an account, so that I can decide what to focus on this weekend.

**As a parent**, I want to check my child's progress from my phone even though she practises on the family laptop, so that I don't need to be at the same device.

**As a parent**, I want to label a practice link "Jimmy" so I can tell my two children's links apart, without my child's name appearing in a web address.

**As a 6-year-old**, I want to see a picture and tap letters to spell it, so that practising feels like a game and not a test.

**As a 6-year-old**, I want to tap a light bulb when I'm stuck, so that I get a letter for free instead of giving up.

**As a 6-year-old**, I want confetti when I get a word right, so that I feel proud and want to do the next one.

**As a 6-year-old**, I want to know how far through I am and see the stars I've earned, without anything telling me I failed.

**As a child who just finished a session**, I want the option to do one more round, so that I can keep going when I'm enjoying it — but I don't want to be pushed into it.

**As a grandparent**, I want to open the same link on my own iPad, so that we can practise together when my grandson visits, and his stars and level are still there.

---

## 4. Functional Requirements

### 4.1 Home page and practice links

1. The home page must be built from `UI_TEMPLATES/home_page` (`code.html`, `DESIGN.md`, `screen.png`), with the adaptations listed in section 6.1.
2. The home page must show five grade pills: Pre-K, Kindergarten, 1st Grade, 2nd Grade, 3rd Grade. The pre-selected grade must be the last grade chosen on this device (read from local storage), or Kindergarten if none.
3. Below the grade pills, the home page must show one card per game:
   - **Spelling** — active, with a "Play Now" button.
   - **Reading** — visibly shown but disabled, labelled "Coming in v2.0". It must not be tappable and must not create a link.
4. Tapping "Play Now" on the Spelling card must create a practice link for the selected grade **automatically** and navigate straight to `taptospell.com/{slug}`. There must be no slug-choice screen, no label prompt, and no confirmation step.
5. If this device already holds a practice link for the selected grade (from its local list of recent links), "Play Now" must open that link instead of creating a new one. A parent who wants a separate link for a second child uses "New link for another child" in the Parents tab (requirement 17).
6. When a link has just been created, the game page must show a one-time, parent-facing share banner over the already-loaded game: the full URL, a "Copy link" button, and a "Share" button using the Web Share API where available (falling back to copy). Dismissing the banner reveals the game. The banner must only appear on the device that created the link, and only once — never when the child opens the shared link on their own device.
7. Each slug must be exactly 10 characters, drawn from the alphabet `abcdefghjkmnpqrstuvwxyz23456789` (lowercase letters and digits, excluding `i`, `l`, `o`, `0`, `1` to avoid misreading).
8. The server must generate exactly one slug per create request, regenerate if it collides with an existing slug, and persist it with its grade in the same request. Slugs must be system-generated: the create endpoint must reject any request that supplies a slug.
9. The system must rate-limit link creation to 10 requests per hour per IP address, returning HTTP 429 beyond that.
10. The parent may optionally add a label (for example "Jimmy") from the parent view after the link exists. The label is stored against the link and shown on the practice page and in the Parents tab. **The label must never appear in the URL.**
11. The practice page must be served at `taptospell.com/{slug}` and built from `UI_TEMPLATES/kids_spelling_word_game` (section 4.2).
12. Opening a valid practice link must start a spelling session immediately — no splash screen, no "Start" button, no consent interstitial. The only exception is the one-time share banner in requirement 6, on the creating device.
13. Opening an invalid or expired slug must show a friendly message with a link to the home page. It must not reveal whether the slug ever existed.
14. The system must rate-limit slug lookups to 20 requests per minute per IP address, returning HTTP 429 beyond that. This prevents someone scripting their way through the slug space.
15. The system must delete links and their progress after 12 months with no activity. A scheduled job must run this daily.
16. The home page header's star count must show the points of the most recently used link on this device, or 0 if there is none. The person icon opens the Parents tab.
17. The bottom navigation must have three tabs: **Home**, **Games** (the same game cards as the home page) and **Parents**. The template's "Grades" tab is removed — grade selection lives on Home. The Parents tab lists the links held on this device (label, grade, stars, level), opens each link's parent view, and offers "New link for another child".

### 4.2 Spelling mode (version 1.0)

18. The spelling page must follow the template layout, top to bottom: header (back, stars, mute), level badge ("Level N • {level name}"), progress bar, prompt banner, picture card, hint bulbs (section 4.4), letter boxes, letter bank with backspace and reset.
19. Each word must present an image of a concrete noun with empty letter boxes beneath it, one box per letter of the answer. Only words whose `picturable` flag is true may be used.
20. The letter bank must contain exactly the letters of the answer (including repeated letters, so "ball" has two `l` tiles) plus distractor letters, arranged **alphabetically, not QWERTY**. Distractor count is 4 for 3–4 letter words, 3 for 5–6, and 2 for 7+, unless the level overrides it (section 4.3). Distractors must not duplicate an answer letter. It must not show the full alphabet.
21. Tapping a tile must place its letter in the next empty box — skipping boxes that are pre-filled or revealed by a hint — and visually consume that tile.
22. The backspace key must remove the most recently placed child letter and return its tile to the bank. "Reset" must clear every child-placed letter. Neither may remove a pre-filled or hint-revealed letter.
23. There is no "Check answer" button. The answer must be checked automatically the moment the last empty box is filled.
24. If the answer is correct, the celebration in section 4.5 must run.
25. If the answer is incorrect, the system must play a retry sound (section 4.11), gently shake the boxes, and return only the incorrectly placed letters to the bank; correctly placed letters stay. There must be no red colouring, no "Oops" or "Try again" text, no penalty counter, no score deduction, and no limit on attempts. The template's red error state and error banner are removed.
26. A round must present the number of words set by the level's `questionsPerRound` (section 4.3), sized to take roughly 4 minutes.
27. The progress bar must fill as the child advances through the round. A "Word N of M" position pill (from the template) is permitted. Numbers may show position and stars earned; nothing numeric may ever show mistakes or attempts.
28. The prompt banner must read "Spell the N-letter word!" (or equivalent copy readable by a 5-year-old). The template's text-to-speech button is removed.
29. The header back button must return to the link's own home screen (requirement 46), never to the global home page, so a child cannot wander into link creation.

### 4.3 Spelling levels

30. Spelling mode must have exactly **5 levels** in version 1.0, defined in `src/data/levels/spelling.json`. No level parameter may be hard-coded; changing a value in the JSON file must change behaviour without a code change.
31. Each level entry must define:

    | Field | Type | Meaning |
    | --- | --- | --- |
    | `id` | 1–5 | Level number |
    | `name` | string | Shown in the level badge, e.g. "Animal Safari" |
    | `icon` | string | Material Symbols icon name for the badge |
    | `wordLength` | `{ min, max }` | Word lengths drawn at this level |
    | `difficulty` | array of `easy` \| `medium` \| `hard` | Difficulty tags drawn at this level |
    | `questionsPerRound` | integer | Words per round |
    | `prefillFirstLetter` | boolean | Whether the first box starts filled |
    | `distractors` | integer, optional | Overrides the length-based distractor count |
    | `pointsPerWord` | integer | Stars awarded per correct word |
    | `wordsToAdvance` | integer | Words mastered at this level before moving up |

32. The default configuration shipped in version 1.0:

    | Level | Name | Word length | Difficulty | First letter pre-filled | Points per word |
    | --- | --- | --- | --- | --- | --- |
    | 1 | Animal Safari | 3 | easy | yes | 10 |
    | 2 | Garden Friends | 3–4 | easy | no | 15 |
    | 3 | Ocean Explorer | 4–5 | easy, medium | no | 20 |
    | 4 | Jungle Trek | 5–6 | medium | no | 25 |
    | 5 | Space Adventure | 6+ | medium, hard | no | 30 |

    All levels default to `questionsPerRound: 10` and `wordsToAdvance: 10`.

33. A new link starts at level 1. When the child has mastered `wordsToAdvance` words at their current level, they move up one level. The change must take effect at the start of the next round, never mid-round, and must be announced on the end-of-round screen ("New level!"). Levels never go down and stop at 5.
34. Within a level, words must be drawn from the link's grade list: previously-missed words first, then unseen words, ordered by `frequencyRank` within `phoneticGroup`. If the grade has too few picturable words matching the level, the system must fill the round from the nearest word lengths, without repeating a word within a round.
35. A build-time validation script must fail the build if the file does not contain exactly 5 levels with ids 1–5, or if any entry breaks the schema. It must warn when a grade × level combination has fewer than `questionsPerRound` matching picturable words.

### 4.4 Hints

36. Each word must show a row of light-bulb hint buttons between the picture and the letter boxes. The number of bulbs must equal **word length − 1** (a 4-letter word shows 3 bulbs). On levels where the first letter is pre-filled, one bulb starts already used, so the child always places at least one letter.
37. Tapping an unused bulb must reveal the correct letter in one box chosen **at random** from the boxes that are not yet correctly filled. Specifically:
    - The revealed box shows the letter in a distinct hint style and is locked.
    - If that box held an incorrect child letter, that tile returns to the bank.
    - The matching tile is consumed from the bank.
    - The bulb switches to a used state and cannot be tapped again.
38. If a reveal fills the last empty box, the answer must be checked automatically (requirement 23). Hints reset for every new word. Hint state must be kept in mid-round local state so a refresh does not restore used bulbs. Each bulb must be at least 48×48 CSS pixels. Using a hint must never trigger a sound, colour or message that implies failure.

### 4.5 Correct-answer celebration

39. When all letters are entered and the answer is correct, the system must, in this order:
    1. turn the boxes to the success colour and play one success sound;
    2. fire [canvas-confetti](https://github.com/catdad/canvas-confetti) for **3 seconds**;
    3. animate the word's stars (`pointsPerWord`) into the header star count;
    4. after the 3 seconds, move automatically to the next word — or to the end-of-round screen after the last word.
40. Letter, hint and backspace input must be disabled during the 3-second celebration.
41. `canvas-confetti` must be installed from npm and bundled, not loaded from a CDN (section 4.10). The confetti canvas must not intercept pointer events.
42. Confetti must respect `prefers-reduced-motion` using the library's `disableForReducedMotion` option. The 3-second pause and success state still apply.

### 4.6 End of round

43. On completing the last word of a round, the system must show a celebration screen (animation plus encouraging copy), the stars earned this round, and a "New level!" message if the child moved up.
44. The celebration screen must offer two clearly-sized options: "One more round" and "All done". Neither may be pre-selected or auto-triggered.
45. "One more round" must start a fresh round at the child's current level.
46. "All done" must return the child to the link's home screen, showing the overall progress bar, current level and total stars for that link.
47. The system must never auto-start a new round.

### 4.7 Local-first storage and cross-device sync

48. All state must be written to `localStorage` first:
    - **Device state:** the list of recent links on this device (slug, grade, label), the last grade chosen, the mute preference, and which links this device created.
    - **Per-link state:** grade, label, total points, current level, per-word stats (attempts, hints used, mastered), mid-round state (current word, filled boxes, used hints), and a queue of rounds not yet synced.
49. On opening a link, the game must render from local state immediately when it exists, then fetch the server state in the background and merge it. The first word must never wait on the network when local state is present. On a device with no local state, the single request needed to resolve the slug is acceptable.
50. The client must sync to the server **once at the end of each round**, as a single batched request — never once per word. If unsynced rounds remain when the page is hidden or closed, the client must flush them with `navigator.sendBeacon`.
51. Each round must carry a client-generated `round_id` (UUID). The server must record it and ignore duplicates, so retries and beacon-plus-fetch double sends never double-count points.
52. When it accepts a round, the server must: add the round's points to the link total; upsert per-word results (attempts summed, earliest `mastered_at` kept, hints summed); set the level to the higher of server and client; and update `last_active`. It must return the authoritative link state. The client replaces its cache with that state and re-applies any rounds still pending.
53. When offline, unsynced rounds must stay in the queue and be retried on the next page open and on the browser's `online` event, with backoff.
54. All `localStorage` reads and writes must be wrapped in `try`/`catch`. Private browsing and locked-down school machines throw rather than returning empty, and an uncaught exception renders a blank screen for the child. If storage is unavailable, the app must keep state in memory and still sync at the end of each round.
55. The server (D1) is the source of truth across devices. A parent opening `?parent` on any other computer or phone must see the state as of the last sync.
56. A word solved with one or more hints counts towards stars but is not marked mastered; it returns for review in a later round.

### 4.8 Parent progress view

57. Appending `?parent` to a practice link must show the parent view. There must be no PIN and no separate link — it is the same URL the child uses.
58. The parent view must always fetch fresh state from the server rather than the device cache, so it is correct on any device.
59. The parent view must show: the label (editable), grade, current level (number and name), total stars, words mastered versus words remaining for the grade, words currently being missed, words that needed hints, the date of the last practice session, and when the link last synced.
60. The parent view must include "Copy link" and "Share" controls for re-sharing.
61. The parent view must not display anything that identifies the child beyond the label the parent chose.

### 4.9 Analytics

62. The system must record exactly four events: `session_start` (grade, mode, level), `session_complete` (item count, elapsed seconds, level), `word_attempt` (correct/incorrect, mode, level, hints used) and `parent_view_open`.
63. Analytics must use a cookieless, no-personal-data tool — Plausible or self-hosted Umami. **Google Analytics must not be used**; it is the most frequently cited COPPA liability in child-directed products.
64. No analytics event may contain a name, label, IP address, or any other identifier beyond the slug.

### 4.10 Compliance

65. The site must publish a privacy policy stating plainly that no personal information is collected from children.
66. The site must maintain a written data retention policy naming the 12-month inactivity period. This is required by the amended COPPA Rule, which reached full compliance on April 22, 2026.
67. No third-party advertising scripts may be loaded anywhere on the site.
68. The system must not ask for, or provide any field accepting, a child's name, age, birthday, school, or photograph.
69. The production build must make no runtime requests to third-party hosts. The UI templates load the Tailwind CDN, Google Fonts and `lh3.googleusercontent.com` images; all three must be replaced with build-time Tailwind, self-hosted fonts (Rubik, Nunito Sans, Material Symbols subset) and local image assets. Google Fonts requests send the child's IP address to Google.

### 4.11 Audio

70. The system must support a **success sound set** of between 1 and 5 audio files. In spelling mode a success sound plays **once, when the word is completed correctly** (requirement 39) — not on each letter.
71. The system must support a **retry sound set** of between 1 and 5 audio files, played when a completed answer is incorrect.
72. Each time a sound is needed, the system must pick one file at random from the relevant set, so repeated play does not become monotonous.
73. Random selection must avoid playing the same file twice in a row when the set contains more than one file.
74. Sound sets must be configurable by dropping files into a known directory without a code change. The system must read whatever files are present, from 1 to 5, and must not break if a set contains only one file.
75. If a sound set is empty or a file fails to load, the system must continue silently. Audio failure must never block interaction or surface an error to the child.
76. The system must include a persistent mute control on every practice screen — the template's header speaker button — with the setting remembered per device in `localStorage`.
77. Audio must not auto-play before the child's first interaction, as mobile browsers block this. The audio context must be initialised on the first tap.
78. Audio files must be preloaded at session start so the sound lands on the tap, not a moment after it.
79. The template's mascot-greeting and "Letter of the Day" phonics audio buttons are removed (narration is out of scope, section 5).

**Tone constraint on the retry sound set.** The retry sounds must be playful, not mocking. A soft boing, a comic slide-whistle, or a gentle cartoon bonk is in scope. A laugh track, a buzzer, a "wrong!" voice line, a sad trombone, or anything a child could read as being laughed at is out of scope, and conflicts with the design principle in section 6 that nothing in the interface may communicate failure. The child must be able to miss the same word five times without the app feeling like it is enjoying the mistake.

### 4.12 Reading mode — ⏸ version 2.0 (not implemented in version 1.0)

> These requirements are kept so the design is not lost. **Do not build them for version 1.0.** Existing reading-mode code stays in the repository behind a disabled feature flag and must not be reachable from any route. The home page shows the Reading card as "Coming in v2.0".

- R1. A reading session must present exactly 10 words.
- R2. Words must come from the Dolch sight word lists, covering pre-primer, primer, 1st, 2nd, and 3rd grade.
- R3. Within a grade, words must be ordered by frequency first, then grouped by phonetic pattern. The first words a child sees in a grade must be the most common ones, so early sessions produce quick wins.
- R4. Each session must draw: any words not yet seen, plus any words answered incorrectly in a previous session, prioritising the latter.
- R5. The child must see a progress bar that fills as they advance through the 10 words.
- R6. A session must be sized to take roughly 4 minutes, matching a 6-year-old's independent attention span.
- R7. A success sound plays on a correct answer, and a retry sound on an incorrect one (section 4.11).
- R8. Version 2.0 must decide whether reading mode gets its own levels file (`src/data/levels/reading.json`) and its own points, using the same schema as section 4.3.

---

## 5. Non-Goals (Out of Scope)

The following are explicitly **not** part of version 1.0:

- **Reading mode.** Deferred to version 2.0 (section 4.12).
- **Parent accounts and payments.** Deferred to week 12, and only if the week-2 return rate clears 25%. Accounts are the only component that adds meaningful compliance weight, so they are not built until there is evidence someone wants them. Cross-device access works through the link itself (section 4.7), not through accounts.
- **Mobile apps.** iOS and Android are out entirely. The whole premise is that there is nothing to install.
- **Narration and text-to-speech.** Reading words aloud, pronunciation playback, mascot greetings and spoken instructions are all out — including the speaker buttons shown in the UI templates. Short interaction sounds are in scope per section 4.11, but speech is not; it multiplies the audio asset count by the size of the word list.
- **Phonics instruction.** We do not teach letter sounds or decoding. The template's "Letter of the Day" panel is removed.
- **Streaks, badges, leaderboards, and notifications.** Out on purpose, not by omission. Streak mechanics are among the most-complained-about features in this category and create pressure on young children that parents actively avoid. Stars and levels (sections 4.3 and 4.5) are in scope because they only ever go up and never compare children with each other.
- **Teacher or classroom dashboards.** A classroom context can pull the product into state student-privacy regimes. Not in version 1.0.
- **Any language other than English.** Any market other than the United States.
- **Custom word lists.** Parents cannot upload this week's spelling list in version 1.0, even though they will ask. It is the most likely version 2.0 feature alongside reading mode.

---

## 6. Design Considerations

**Primary device.** Build mobile-first. The parent creates the link on a phone; the child practises on a tablet. Desktop is a secondary case.

**Touch targets.** Letter tiles and hint bulbs must be at least 48×48 CSS pixels with 8px minimum spacing. Children aged 5–8 have less precise motor control than adults, and mis-taps read as the app being broken.

**Reading level.** All child-facing copy must be readable by a 5-year-old, or replaced with an icon. Parent-facing copy may use ordinary adult language.

**Tone on failure.** Nothing in the interface may communicate that the child has failed. No red X, no red boxes, no buzzer, no "Wrong!" or "Oops" text, no attempts counter. An incorrect answer shakes, returns the wrong letters, and that is all. The spelling template's error colours and error banner must be removed, and its red "Reset" link restyled in a neutral colour.

**Progress display.** The child sees a filling bar, their position in the round, their level and their stars. Stars only ever increase. The parent sees full counts, including mastered and missed words. Missed-word data never appears on a child screen.

**Images.** Roughly 200 pictures of concrete nouns are needed. They must be visually consistent, because inconsistent art read side-by-side looks unfinished. Images are generated with Gemini using one fixed style prompt (see `tasks-taptospell.md`); the licence must permit commercial use, since the product will charge later.

**Branding note.** Version 1.0 is spelling-only, so "TapToSpell" now describes the whole launch product. The home page still shows the Reading card as "Coming in v2.0" so returning parents know it is planned.

### 6.1 UI templates

The Stitch templates in `UI_TEMPLATES/` are the design source for version 1.0. They replace the Screen 1–5 mockup specifications from revision 1. Both templates share one design system, `DESIGN.md` ("Playful Educational Game System": amber primary `#ffb800`, blue secondary `#04a8ff`, violet tertiary `#7825ea`, Rubik headlines, Nunito Sans body, chunky extruded "push-button" shadows). That design system supersedes the revision 1 shared style sentence (cream / teal / coral).

| Template | Becomes | Required adaptations |
| --- | --- | --- |
| `UI_TEMPLATES/home_page` | Home page (`/`) | Keep header, mascot card, grade pills and bottom nav. Replace "Suggested Daily Game" with Spelling (Play Now) and Reading ("Coming in v2.0", disabled) cards. Remove the mascot volume button and the "Letter of the Day" phonics panel. Remove the "Grades" nav tab. Wire the star count and person icon per requirement 16. |
| `UI_TEMPLATES/kids_spelling_word_game` | Spelling page (`/{slug}`) | Keep header, level badge, striped progress bar, prompt banner, picture card, letter boxes and letter grid. Add the hint-bulb row (4.4) and confetti (4.5). Remove the text-to-speech button, the "Check answer" button, the red error state and banner, and the test-helper script hooks. Make the header back button go to the link home (requirement 29). Turn the header speaker into the mute toggle. |

Two screens still need designs in the same `DESIGN.md` style, built from the revision 1 descriptions below:

**Screen 6 — Celebration.** Phone portrait. Cheerful but not frantic: confetti, a smiling sun or star illustration, the words "Nice work!", the stars earned this round, and "New level!" when relevant. Below, two equally sized buttons stacked vertically — "One more round" and "All done" — with neither visually dominant and neither pre-selected or highlighted as a default.

**Screen 7 — Parent view.** Phone portrait, adult-facing, more information-dense than the child screens. Heading showing the label "Jimmy — 2nd Grade", with the current level and total stars. A summary line: "84 of 200 words mastered", with a bar showing that proportion. Below, sections headed "Working on" and "Needed hints", each listing words as small chips. Then "Last practised: 2 days ago" and "Last synced". At the bottom, "Copy link" and "Share" buttons. No photo, no child avatar, no personal details beyond the label.

**What the review is for.** Catching layout problems before code — tile sizing on a narrow screen, whether the hint bulbs and letter bank crowd the picture, whether the two celebration buttons really look equal. Review at actual phone width, not zoomed in on a laptop.

---

## 7. Technical Considerations

**Stack**

- TanStack Start running on Cloudflare Workers
- Cloudflare D1 (SQLite) as the primary data store
- Static assets (word lists, level config, images, fonts, sounds) shipped in the bundle
- `canvas-confetti` (npm, bundled) for the correct-answer celebration
- Cloudflare KV optional, for caching compiled word-list JSON only

**Do not use Workers KV for progress.** The KV free tier allows 100,000 reads/day but only **1,000 writes/day**. At roughly 30 progress writes per child per day that caps the product at about 33 children. KV writes also cost $5.00 per million against D1's $1.00 per million, and KV is eventually consistent. D1 allows 100,000 rows written per day free, with read-after-write consistency.

**Do not use Durable Objects.** They coordinate concurrent clients — shared rooms, live collaboration, distributed locks. One child practising alone has nothing to coordinate, and they require the paid Workers plan. Two devices on one link are reconciled by the idempotent round sync in section 4.7, not by live coordination.

**Do not use Supabase.** Supabase Pro is $25/month, which consumes the entire budget. The Supabase free tier pauses projects after 7 days of inactivity, which is exactly the state a pre-launch project is in.

**Schema** (revision 2 changes are applied by `migrations/0002_levels_points_sync.sql`)

```sql
CREATE TABLE links (
  slug           TEXT PRIMARY KEY,   -- 10 chars, system-generated
  grade          INTEGER NOT NULL,   -- 0=pre-primer, 1=primer, 2=1st, 3=2nd, 4=3rd
  label          TEXT,               -- parent's private label; never in the URL
  points         INTEGER NOT NULL DEFAULT 0,  -- rev 2: total stars
  current_level  INTEGER NOT NULL DEFAULT 1,  -- rev 2: spelling level 1–5
  created_at     INTEGER NOT NULL,
  last_active    INTEGER NOT NULL,   -- drives 12-month expiry
  parent_id      TEXT                -- NULL until accounts exist in week 12
);

CREATE TABLE progress (
  slug         TEXT NOT NULL,
  word         TEXT NOT NULL,
  mode         TEXT NOT NULL,      -- 'write' = spelling mode (v1.0) | 'read' (v2.0)
  attempts     INTEGER NOT NULL DEFAULT 0,
  hints_used   INTEGER NOT NULL DEFAULT 0,  -- rev 2
  mastered_at  INTEGER,
  PRIMARY KEY (slug, word, mode)
);

-- rev 2: idempotency for local-first sync
CREATE TABLE rounds (
  round_id     TEXT PRIMARY KEY,   -- client-generated UUID
  slug         TEXT NOT NULL,
  level        INTEGER NOT NULL,
  points       INTEGER NOT NULL,
  received_at  INTEGER NOT NULL
);

CREATE INDEX idx_links_last_active ON links(last_active);
CREATE INDEX idx_rounds_received_at ON rounds(received_at);
```

The daily expiry job must also delete `rounds` rows older than 30 days; they exist only to reject duplicate sends.

**Cost at scale**

| Monthly active users | Cost | Notes |
| --- | --- | --- |
| 0 | $0 + ~$12/yr domain | Workers Free, D1 Free |
| 1,000 | $0 | Static asset requests are free and unlimited |
| 10,000 | $5/month | Workers Paid; boundary crossed at ~3,300 MAU |

The binding constraint is 100,000 Workers requests per day, not database usage. Because progress syncs once per round (one request, about 12 rows: 10 progress rows, 1 link row, 1 round row) rather than once per word, D1 stays well inside its free allowance even at 10,000 MAU.

**Content licensing.** The Dolch word lists are out of copyright — 220 service words plus 95 nouns, covering every grade in scope, at $0. Do not build on the Fry 1000 list; it is more recent and its copyright status has not been verified. `canvas-confetti` is ISC-licensed and permits commercial use.

**Shared-device behaviour.** Progress follows the link, not the browser. Each device keeps a local copy for instant start and offline play, and syncs to D1 at the end of every round. A child practising at school and at home shares one progress state, provided the same link is used, and a parent can check that state from any device with `?parent`. A school machine that wipes profiles nightly loses at most an unsynced round.

---

## 8. Success Metrics

| # | Metric | Threshold | How measured | Deadline |
| --- | --- | --- | --- | --- |
| 1 | Session completion | 60% | `session_complete` ÷ `session_start` | Launch + 4 weeks |
| 2 | Week-2 return | 25% | Distinct slugs active again 8–14 days after first use | Launch + 6 weeks |
| 3 | Paid conversion | 15 paying parents | Stripe | Launch + 12 weeks |

**Metric 2 is the one that matters.** Completion can be gamed by shortening sessions, and revenue at this scale is statistical noise. A child returning without a notification, a streak, or an account is the only honest evidence that the product is wanted.

**Kill criteria.** Stop the project if week-2 return is below 10% with at least 200 distinct first-use links by launch + 8 weeks. That combination means a real sample size and a return rate that no pricing or marketing work will rescue.

**Explicitly not success metrics:** YouTube views, social shares, signups, press coverage. Each measures interest in the idea rather than use of the product.

---

## 9. Open Questions

**Resolved since revision 1**

- ~~1. Image budget~~ — images are generated with Gemini.
- ~~2. Distractor scaling~~ — 4 / 3 / 2 by word length, overridable per level (requirement 20).
- ~~6. Where the success sound fires in spelling mode~~ — once, on correct word completion (requirement 70).

**Still open**

3. **Grade selection by the parent.** What happens if the parent picks the wrong grade — can the grade be changed later from the parent view, and does changing it keep stars, level and existing progress?
4. **Image sourcing for abstract Dolch words.** Spelling mode draws only from picturable words, mostly the 95 Dolch nouns. Spread across 5 grades and 5 levels, some grade × level combinations will be thin (requirement 35 warns about this). Is 95 enough, or do we add picturable nouns beyond Dolch?
5. **Link discovery.** If a parent loses the link and clears the browser, there is no way to recover it, because we hold nothing that identifies them. Is that acceptable for version 1.0, or is an "email me my link" fallback needed — noting that an email address is parent data, not child data, and so is permissible?
7. **Sound sources.** Are you supplying the audio files yourself, or do they need sourcing? If sourced, they need a licence permitting commercial use, same constraint as the images.
8. **Hints and mastery.** Requirement 56 proposes that hinted words earn full stars but are not marked mastered. Alternative: award fewer stars per hint used. Fewer stars risks feeling like a penalty; no penalty risks children tapping every bulb. Which?
9. **Numbers on child screens.** The spelling template shows a star count and a "Question 1 of 5" pill. Revision 1 allowed no numbers on child screens. This revision allows position and stars but never mistakes (requirement 27). Confirm.
10. **Round length.** The template shows 5 questions per round; revision 1 specified 10. The JSON defaults to 10. Should early levels use 5?
11. **Second child on the same device.** Requirement 5 reuses this device's existing link for a grade. Two siblings in the same grade on one tablet need "New link for another child" from the Parents tab. Is that discoverable enough, or should "Play Now" ask "Same child or new child?" when a link already exists?

---

## Final instructions for the implementing developer

Do not begin the revision 2 rework until open questions 8, 9 and 10 are answered — each one changes a functional requirement above. Question 4 must be answered before levels 4–5 content is locked. Questions 3, 5 and 11 can be resolved during the build.
