# PRD: TapToSpell

**Status:** Draft for approval
**Date:** 2026-10-30
**Target launch:** Monday, January 4, 2027
**Author:** Johnny

---

## 1. Introduction / Overview

TapToSpell is a free web app that lets children aged 5–8 practise reading vocabulary and spelling without downloading anything or creating an account.

**The problem.** A parent whose child has twenty spelling words due Friday cannot get that child practising in under two minutes. Every good option in this space demands an app-store download, an account, or a free-trial signup before the first word appears. Khan Academy Kids is excellent and free but app-only. ABCmouse puts a subscription wall in front of a parent who wants twenty words, not a ten-subject curriculum. Printable worksheets work but give no feedback and keep no record.

**The goal.** Remove every step between a parent deciding to help and a child practising. A parent visits the site, picks a grade, gets a shareable link, and sends it to the child's device. The child opens the link and practice begins immediately — no login, no install, no interstitial.

**What we are testing.** Whether removing that friction is enough on its own to make children return weekly, and whether parents will later pay for progress tracking. We are not trying to teach better than anyone else. We are competing purely on time-to-first-word.

---

## 2. Goals

1. A child can go from receiving a link to answering the first word in under 10 seconds, with zero taps beyond opening the link.
2. 60% of started practice sessions reach the final word, measured 4 weeks after launch.
3. 25% of practice links show activity again 8–14 days after first use, measured 6 weeks after launch.
4. Collect no personal information from any child, anywhere in the product.
5. Keep running costs at $0/month until the product exceeds roughly 3,300 monthly active users.
6. Ship the complete feature set described here in 70 developer-hours.

---

## 3. User Stories

**As a parent of a 2nd grader**, I want to send my child a practice link from my phone, so that she can work on this week's spelling words on her tablet while I make dinner.

**As a parent**, I want to see which words my child has mastered without creating an account, so that I can decide what to focus on this weekend.

**As a parent**, I want to label a practice link "Jimmy" so I can tell my two children's links apart, without my child's name appearing in a web address.

**As a 6-year-old**, I want to see a picture and tap letters to spell it, so that practising feels like a game and not a test.

**As a 6-year-old**, I want to know how far through I am without seeing a score, so that I don't feel like I'm failing.

**As a child who just finished a session**, I want the option to do one more round, so that I can keep going when I'm enjoying it — but I don't want to be pushed into it.

**As a grandparent**, I want to open the same link on my own iPad, so that we can practise together when my grandson visits.

---

## 4. Functional Requirements

### 4.1 Practice links

1. The system must let a visitor create a practice link from the home page by selecting a grade level and tapping a single button.
2. The system must generate three candidate slugs and present them to the parent, who picks one. Slugs must be system-generated. The parent must not be able to type their own.
3. Each slug must be exactly 10 characters, drawn from the alphabet `abcdefghjkmnpqrstuvwxyz23456789` (lowercase letters and digits, excluding `i`, `l`, `o`, `0`, `1` to avoid misreading).
4. The system must reject a generated slug and regenerate if it already exists in the database.
5. The system must let the parent optionally add a label (for example "Jimmy") after picking a slug. The label is stored against the link and shown on the practice page. **The label must never appear in the URL.**
6. The practice page must be served at `taptospell.com/{slug}`.
7. Opening a valid practice link must start a practice session immediately — no splash screen, no "Start" button, no consent interstitial.
8. Opening an invalid or expired slug must show a friendly message with a link to create a new one. It must not reveal whether the slug ever existed.
9. The system must rate-limit slug lookups to 20 requests per minute per IP address, returning HTTP 429 beyond that. This prevents someone scripting their way through the slug space.
10. The system must delete links and their progress after 12 months with no activity. A scheduled job must run this daily.

### 4.2 Reading mode

11. A reading session must present exactly 10 words.
12. Words must come from the Dolch sight word lists, covering pre-primer, primer, 1st, 2nd, and 3rd grade — all grades available at launch.
13. Within a grade, words must be ordered by frequency first, then grouped by phonetic pattern. The first words a child sees in a grade must be the most common ones, so early sessions produce quick wins.
14. Each session must draw: any words not yet seen, plus any words answered incorrectly in a previous session, prioritising the latter.
15. The child must see a progress bar that fills as they advance through the 10 words. The bar must show no numbers, no percentage, and no score.
16. A session must be sized to take roughly 4 minutes, matching a 6-year-old's independent attention span.

### 4.3 Writing mode (spelling from image)

17. A writing session must present an image of a concrete noun with empty letter boxes beneath it, one box per letter of the answer.
18. Below the boxes, the system must show a letter bank containing exactly the letters of the answer plus 4 distractor letters, shuffled. It must not show the full alphabet — 26 tiles is overwhelming for a 5-year-old.
19. The on-screen keyboard must be arranged **alphabetically, not QWERTY**. Children this age have no QWERTY mental model, and alphabetical order is itself a skill they are learning.
20. Tapping a correct letter must fill the next empty box and visually consume that tile from the bank.
21. Tapping an incorrect letter must shake the tile and return it to the bank, and play a sound as specified in section 4.9. There must be no penalty counter, no score deduction, and no limit on attempts.
22. Difficulty must escalate in two stages: first by word length (3-letter words before 4-letter, and so on), then by removing the first-letter hint that is pre-filled for the earliest words.
23. Writing sessions must follow the same 10-item, ~4-minute structure as reading sessions.

### 4.4 End of session

24. On completing the tenth item, the system must show a celebration screen (animation plus encouraging copy).
25. The celebration screen must offer two clearly-sized options: "One more round" and "All done". Neither may be pre-selected or auto-triggered.
26. "One more round" must start a fresh session of 10 new items in the same mode.
27. "All done" must return the child to a simple home screen showing the overall progress bar for that link.
28. The system must never auto-start a new session.

### 4.5 Progress storage

29. Mid-session state (current word, which boxes are filled) must be held in `localStorage` so that an accidental refresh does not lose the round.
30. Progress must be written to the database **once at session end**, as a single batched upsert — not once per word. Writing per word would exceed free-tier database limits at roughly 330 daily active children.
31. All `localStorage` reads and writes must be wrapped in `try`/`catch`. Private browsing and locked-down school machines throw rather than returning empty, and an uncaught exception renders a blank screen for the child.
32. The database is the source of truth. `localStorage` is a convenience only, and the app must work correctly if it is unavailable.

### 4.6 Parent progress view

33. Appending `?parent` to a practice link must show the parent view. There must be no PIN and no separate link — it is the same URL the child uses.
34. The parent view must show: words mastered versus words remaining for the grade, the date of the last practice session, a list of words currently being missed, and the link's label if one was set.
35. The parent view must include a "copy link" control for re-sharing.
36. The parent view must not display anything that identifies the child beyond the label the parent chose.

### 4.7 Analytics

37. The system must record exactly four events: `session_start` (with grade and mode), `session_complete` (with item count and elapsed seconds), `word_attempt` (with correct/incorrect and mode), and `parent_view_open`.
38. Analytics must use a cookieless, no-personal-data tool — Plausible or self-hosted Umami. **Google Analytics must not be used**; it is the most frequently cited COPPA liability in child-directed products.
39. No analytics event may contain a name, label, IP address, or any other identifier beyond the slug.

### 4.8 Compliance

40. The site must publish a privacy policy stating plainly that no personal information is collected from children.
41. The site must maintain a written data retention policy naming the 12-month inactivity period. This is required by the amended COPPA Rule, which reached full compliance on April 22, 2026.
42. No third-party advertising scripts may be loaded anywhere on the site.
43. The system must not ask for, or provide any field accepting, a child's name, age, birthday, school, or photograph.

### 4.9 Audio

44. The system must support a **success sound set** of between 1 and 5 audio files, played when the child answers correctly. In reading mode this fires on a correct answer; in writing mode it fires on each correctly placed letter.
45. The system must support a **retry sound set** of between 1 and 5 audio files, played when the child taps an incorrect letter or gives an incorrect answer.
46. Each time a sound is needed, the system must pick one file at random from the relevant set, so repeated play does not become monotonous.
47. Random selection must avoid playing the same file twice in a row when the set contains more than one file.
48. Sound sets must be configurable by dropping files into a known directory without a code change. The system must read whatever files are present, from 1 to 5, and must not break if a set contains only one file.
49. If a sound set is empty or a file fails to load, the system must continue silently. Audio failure must never block interaction or surface an error to the child.
50. The system must include a persistent mute control, visible on every practice screen, with the setting remembered per device in `localStorage`.
51. Audio must not auto-play before the child's first interaction, as mobile browsers block this. The audio context must be initialised on the first tap.
52. Audio files must be preloaded at session start so the sound lands on the tap, not a moment after it.

**Tone constraint on the retry sound set.** The retry sounds must be playful, not mocking. A soft boing, a comic slide-whistle, or a gentle cartoon bonk is in scope. A laugh track, a buzzer, a "wrong!" voice line, a sad trombone, or anything a child could read as being laughed at is out of scope, and conflicts with the design principle in section 6 that nothing in the interface may communicate failure. The child must be able to miss the same letter five times without the app feeling like it is enjoying the mistake.

---

## 5. Non-Goals (Out of Scope)

The following are explicitly **not** part of v1:

- **Parent accounts and payments.** Deferred to week 12, and only if the week-2 return rate clears 25%. Accounts are the only component that adds meaningful compliance weight, so they are not built until there is evidence someone wants them.
- **Mobile apps.** iOS and Android are out entirely. The whole premise is that there is nothing to install.
- **Narration and text-to-speech.** Reading words aloud, pronunciation playback, and spoken instructions are all out. Short interaction sounds are now in scope per section 4.9, but speech is not — it multiplies the audio asset count by the size of the word list.
- **Phonics instruction.** We do not teach letter sounds or decoding. We provide practice on words the child is already being taught.
- **Streaks, badges, leaderboards, and notifications.** Out on purpose, not by omission. Streak mechanics are among the most-complained-about features in this category and create pressure on young children that parents actively avoid.
- **Teacher or classroom dashboards.** A classroom context can pull the product into state student-privacy regimes. Not in v1.
- **Any language other than English.** Any market other than the United States.
- **Custom word lists.** Parents cannot upload this week's spelling list in v1, even though they will ask. It is the most likely v2 feature.

---

## 6. Design Considerations

**Primary device.** Build mobile-first. The parent creates the link on a phone; the child practises on a tablet. Desktop is a secondary case.

**Touch targets.** Letter tiles must be at least 48×48 CSS pixels with 8px minimum spacing. Children aged 5–8 have less precise motor control than adults, and mis-taps read as the app being broken.

**Reading level.** All child-facing copy must be readable by a 5-year-old, or replaced with an icon. Parent-facing copy may use ordinary adult language.

**Tone on failure.** Nothing in the interface may communicate that the child has failed. No red X, no buzzer, no "Wrong!" text, no attempts counter. A wrong tap shakes and resets, and that is all.

**Progress display.** The child sees a filling bar and nothing numeric. The parent sees counts. These are two different views of the same data and must never be mixed.

**Images.** Roughly 200 pictures of concrete nouns are needed. They must be visually consistent, because inconsistent art read side-by-side looks unfinished. Two routes: free sources (Openverse, Wikimedia Commons) at $0 with inconsistency accepted, or a purchased icon set at $30–60 one-off. Whichever is chosen, the licence must permit commercial use, since the product will charge later.

**Branding note.** The name "TapToSpell" describes only the writing half of the product. Reading is half the content. The home page must show both modes above the fold, and all marketing copy must say "reading and spelling practice" rather than echoing the domain name.

### 6.1 UI mockup specifications

Seven screens need mockups before build. Each specification below is written to be used directly as an image-generation prompt, or as a brief for hand-built mockups. Generate all seven in one session using the same style sentence so they read as one product.

**Shared style sentence — paste into every prompt:**

> Clean mobile-first web app UI for young children, flat vector illustration style, soft rounded corners, generous whitespace, large friendly sans-serif type, warm pastel palette of cream background with teal and coral accents, no gradients, no drop shadows, no clutter, calm and uncluttered rather than busy or arcade-like.

**Screen 1 — Home / grade picker.** Phone portrait. App name at top. One short line: "Free reading and spelling practice for ages 5–8." Below it, five large tappable grade cards in a vertical stack, labelled Pre-K, Kindergarten, 1st Grade, 2nd Grade, 3rd Grade. A single prominent button beneath reading "Create practice link". Both the reading and spelling modes must be visibly represented above the fold — show a small book icon and a small letter-tile icon paired near the headline. No signup field anywhere.

**Screen 2 — Slug choice and label.** Phone portrait. Heading: "Pick a link for your child." Three stacked option cards, each showing a full practice URL in monospace, such as `taptospell.com/k7m2xq4rvb`. One card visibly selected with a teal outline. Beneath them, an optional text field labelled "Add a name just for you (optional)" with placeholder "Jimmy". Small grey helper text below: "This name is private — it never appears in the link." A primary button reading "Create link".

**Screen 3 — Reading session.** Phone portrait, child-facing. A single word displayed very large and centred, for example "because". Nothing else competing for attention. A thin horizontal progress bar near the top, filled roughly 40%, with no numbers, no percentage, and no score anywhere. A small mute speaker icon in the top-right corner. No back button, no menu, no navigation chrome.

**Screen 4 — Writing session.** Phone portrait, child-facing. Top third: a flat vector illustration of a cat in a soft rounded frame. Middle: three empty letter boxes in a row, the first one filled with "c". Bottom: a letter bank of seven large rounded square tiles in alphabetical order, each at least 48 by 48 pixels with clear spacing, showing assorted letters. Thin progress bar at top, no numbers. Mute icon top-right.

**Screen 5 — Writing session, incorrect tap.** Identical to Screen 4, but one letter tile is mid-shake, shown tilted a few degrees with a soft motion arc. No red colouring, no X mark, no error message, no counter. The tile is simply moving back to where it came from.

**Screen 6 — Celebration.** Phone portrait. Cheerful but not frantic: a few confetti shapes, a smiling sun or star illustration, and the words "Nice work!" Below, two equally sized buttons stacked vertically — "One more round" and "All done" — with neither visually dominant and neither pre-selected or highlighted as a default.

**Screen 7 — Parent view.** Phone portrait, adult-facing, more information-dense than the child screens. Heading showing the label "Jimmy — 2nd Grade". A summary line: "84 of 200 words mastered". A horizontal bar showing that proportion, this one allowed to display numbers. Below, a section headed "Working on" listing five words as small chips. Below that, "Last practised: 2 days ago". At the bottom, a "Copy link" button. No photo, no child avatar, no personal details beyond the label.

**What the mockups are for.** They exist to catch layout problems before any code is written — tile sizing on a narrow screen, whether the letter bank crowds the image, whether the two celebration buttons really look equal. Review them at actual phone width, not zoomed in on a laptop.

---

## 7. Technical Considerations

**Stack**

- TanStack Start running on Cloudflare Workers
- Cloudflare D1 (SQLite) as the primary data store
- Static assets (word lists, images) shipped in the bundle
- Cloudflare KV optional, for caching compiled word-list JSON only

**Do not use Workers KV for progress.** The KV free tier allows 100,000 reads/day but only **1,000 writes/day**. At roughly 30 progress writes per child per day that caps the product at about 33 children. KV writes also cost $5.00 per million against D1's $1.00 per million, and KV is eventually consistent. D1 allows 100,000 rows written per day free, with read-after-write consistency.

**Do not use Durable Objects.** They coordinate concurrent clients — shared rooms, live collaboration, distributed locks. One child practising alone has nothing to coordinate, and they require the paid Workers plan.

**Do not use Supabase.** Supabase Pro is $25/month, which consumes the entire budget. The Supabase free tier pauses projects after 7 days of inactivity, which is exactly the state a pre-launch project is in.

**Schema**

```sql
CREATE TABLE links (
  slug         TEXT PRIMARY KEY,   -- 10 chars, system-generated
  grade        INTEGER NOT NULL,   -- 0=pre-primer, 1=primer, 2=1st, 3=2nd, 4=3rd
  label        TEXT,               -- parent's private label; never in the URL
  created_at   INTEGER NOT NULL,
  last_active  INTEGER NOT NULL,   -- drives 12-month expiry
  parent_id    TEXT                -- NULL until accounts exist in week 12
);

CREATE TABLE progress (
  slug         TEXT NOT NULL,
  word         TEXT NOT NULL,
  mode         TEXT NOT NULL,      -- 'read' | 'write'
  attempts     INTEGER NOT NULL DEFAULT 0,
  mastered_at  INTEGER,
  PRIMARY KEY (slug, word, mode)
);

CREATE INDEX idx_links_last_active ON links(last_active);
```

**Cost at scale**

| Monthly active users | Cost | Notes |
| --- | --- | --- |
| 0 | $0 + ~$12/yr domain | Workers Free, D1 Free |
| 1,000 | $0 | Static asset requests are free and unlimited |
| 10,000 | $5/month | Workers Paid; boundary crossed at ~3,300 MAU |

The binding constraint is 100,000 Workers requests per day, not database usage. Because progress flushes once per session rather than once per word, D1 stays well inside its free allowance even at 10,000 MAU.

**Content licensing.** The Dolch word lists are out of copyright — 220 service words plus 95 nouns, covering every grade in scope, at $0. Do not build on the Fry 1000 list; it is more recent and its copyright status has not been verified.

**Shared-device behaviour.** Because progress follows the link rather than the browser, a child practising at school and at home shares one progress state, provided the same link is used. A school machine that wipes profiles nightly loses nothing. This is the main architectural benefit of the link model over browser-local storage.

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

1. **Image budget.** $0 with visually inconsistent free images, or $30–60 once for a consistent set? This is the only cash decision in v1 and it visibly affects perceived quality.
2. **Distractor letters in the letter bank.** Requirement 18 specifies 4 distractors. For a 3-letter word that is a 7-tile bank; for an 8-letter word, 12 tiles. Should the distractor count scale down for longer words to keep the bank manageable?
3. **Grade selection by the parent.** The parent picks a grade when creating the link. What happens if they pick wrong — can the grade be changed later from the parent view, and does changing it preserve existing progress?
4. **Image sourcing for abstract Dolch words.** Most Dolch service words ("the", "because", "would") have no picture. Writing mode presumably draws only from the 95 Dolch nouns. Confirm that writing mode is limited to nouns, and whether 95 words is enough content for the mode.
5. **Link discovery.** If a parent loses the link, there is no way to recover it, because we hold nothing that identifies them. Is that acceptable for v1, or is a "email me my link" fallback needed — noting that an email address is parent data, not child data, and so is permissible?

6. **Where the success sound fires in writing mode.** Requirement 44 assumes it plays on each correctly placed letter. For an 8-letter word that is 8 sounds in a few seconds, which may become noise. The alternative is one sound on word completion only. Which?

7. **Sound sources.** Are you supplying the audio files yourself, or do they need sourcing? If sourced, they need a licence permitting commercial use, same constraint as the images.

---

## Final instructions for the implementing developer

Do not begin implementation until open questions 1, 2, and 4 are answered — each one changes a functional requirement above. Questions 3 and 5 can be resolved during the build.
