# Tasks: TapToSpell

Generated from `prd-taptospell.md`.

**Decisions folded in since the first PRD draft:**
- Images are generated with Gemini (Nano Banana), not sourced from stock libraries.
- Letter-bank distractors scale down as words get longer: 4 for 3–4 letter words, 3 for 5–6, 2 for 7+.
- Word data starts from the Dolch lists but is an extensible structure, categorised by grade and tagged easy / medium / hard.
- Two configurable sound sets, 1–5 files each, chosen at random per play.
- Mockups are generated and reviewed before any application code is written.

**Parent tasks were renumbered in this revision.** Mockups became 1.0 and audio became 7.0, shifting everything after them. If you have already started work against the previous numbering, the task content is unchanged — only the numbers moved.

---

## Relevant Files

| File | Purpose |
| --- | --- |
| `docs/mockups/*.png` | The seven generated screen mockups, reviewed before build |
| `docs/mockups/style-prompt.md` | The locked shared style sentence used for every mockup |
| `wrangler.jsonc` | Cloudflare Workers config: D1 binding, static assets, routes, cron trigger |
| `app.config.ts` | TanStack Start configuration, Workers deployment target |
| `migrations/0001_init.sql` | D1 schema: `links` and `progress` tables plus indexes |
| `src/data/words/schema.ts` | TypeScript type for a word entry; the contract every word list must satisfy |
| `src/data/words/grade-k.json` … `grade-3.json` | Word lists per grade, tagged with difficulty and picturability |
| `src/data/words/README.md` | How to add words to a list without breaking the pipeline |
| `scripts/generate-images.ts` | Calls Gemini to generate one image per picturable word using a fixed style prompt |
| `scripts/validate-words.ts` | Checks word entries against the schema; flags picturable words with no image |
| `scripts/validate-sounds.ts` | Checks each sound set holds 1–5 playable files of the expected format |
| `public/images/words/*.webp` | Generated word images, one per picturable word |
| `public/sounds/success/*.mp3` | Success sound set, 1–5 files |
| `public/sounds/retry/*.mp3` | Retry sound set, 1–5 files |
| `src/lib/slug.ts` | Slug generation from the unambiguous alphabet, collision checking |
| `src/lib/slug.test.ts` | Tests for `slug.ts` |
| `src/lib/words.ts` | Word selection: which 10 words a session draws, ordering, difficulty progression |
| `src/lib/words.test.ts` | Tests for `words.ts` |
| `src/lib/letter-bank.ts` | Builds the shuffled letter bank with scaled distractor count |
| `src/lib/letter-bank.test.ts` | Tests for `letter-bank.ts` |
| `src/lib/audio.ts` | Sound set discovery, preloading, no-repeat random selection, mute state |
| `src/lib/audio.test.ts` | Tests for `audio.ts`, including empty-set and load-failure paths |
| `src/lib/progress.ts` | Reads and batch-writes progress to D1 |
| `src/lib/progress.test.ts` | Tests for `progress.ts` |
| `src/lib/local-state.ts` | Guarded `localStorage` wrapper for mid-session state and mute preference |
| `src/lib/local-state.test.ts` | Tests for `local-state.ts`, including the throw path |
| `src/lib/rate-limit.ts` | Per-IP rate limiting for slug lookups |
| `src/routes/index.tsx` | Home page: grade picker, link creation, slug choice, label entry |
| `src/routes/$slug.tsx` | Practice page; reads `?parent` to switch to the parent view |
| `src/routes/api/links.ts` | POST creates a link; GET resolves a slug |
| `src/routes/api/progress.ts` | POST accepts the end-of-session batch write |
| `src/components/ReadingSession.tsx` | Reading mode UI |
| `src/components/WritingSession.tsx` | Writing mode UI: image, letter boxes, letter bank |
| `src/components/AlphabetKeyboard.tsx` | Alphabetically ordered on-screen keyboard |
| `src/components/ProgressBar.tsx` | Child-facing bar — no numbers, no score |
| `src/components/MuteToggle.tsx` | Persistent mute control shown on every practice screen |
| `src/components/CelebrationScreen.tsx` | End-of-session screen with the two choices |
| `src/components/ParentView.tsx` | Parent progress view |
| `src/lib/analytics.ts` | The four events; no identifiers beyond the slug |
| `src/workers/expire-links.ts` | Daily cron job deleting links inactive for 12 months |
| `public/privacy.html` | Privacy policy |
| `docs/data-retention-policy.md` | Written retention policy naming the 12-month period |

### Notes

- Tests sit alongside the code they test: `slug.ts` and `slug.test.ts` in the same directory.
- This stack uses **Vitest with `@cloudflare/vitest-pool-workers`**, not Jest. It runs tests inside the real Workers runtime against a local D1 instance, which Jest cannot do. Run with `npx vitest` or `npx vitest src/lib/slug.test.ts` for a single file.
- Run `npx wrangler d1 migrations apply taptospell --local` before the first test run.
- Audio tests need a stubbed `HTMLAudioElement`; the Workers pool does not provide one. Keep `audio.ts` free of direct DOM calls so its selection logic can be tested without a browser.
- `scripts/` files are build-time tooling and are not deployed. They may use the Node APIs the Worker runtime lacks.

### Instructions for completing tasks

Mark each sub-task complete by changing `- [ ]` to `- [x]`. Update this file after each sub-task, not after each parent task.

---

## Tasks

- [x] **0.0 Create the feature branch**
  - [x] 0.1 Run `git checkout -b feature/taptospell`

- [x] **1.0 Generate and review UI mockups**
  - [x] 1.1 Save the shared style sentence from PRD section 6.1 to `docs/mockups/style-prompt.md` and treat it as locked for the whole set
  - [ ] 1.2 Generate Screen 1, Home / grade picker
  - [ ] 1.3 Generate Screen 2, Slug choice and label
  - [ ] 1.4 Generate Screen 3, Reading session
  - [x] 1.5 Generate Screen 4, Writing session
  - [ ] 1.6 Generate Screen 5, Writing session incorrect tap
  - [ ] 1.7 Generate Screen 6, Celebration
  - [ ] 1.8 Generate Screen 7, Parent view
  - [x] 1.9 View all seven at actual phone width, not zoomed on a laptop, and check three things specifically: whether the letter bank crowds the image on Screen 4, whether tiles stay comfortably tappable, and whether the two celebration buttons genuinely read as equal rather than one looking like the default
  - [x] 1.10 Regenerate any screen that fails that review, then record which layout decisions the mockups changed so the build follows the reviewed version rather than the original description

- [x] **2.0 Scaffold the application, deployment pipeline, and database**
  - [x] 2.1 Initialise a TanStack Start project configured for the Cloudflare Workers deployment target
  - [x] 2.2 Configure `wrangler.jsonc` with the static assets binding, so asset requests stay free and unmetered
  - [x] 2.3 Create the D1 database and add its binding to `wrangler.jsonc`
  - [x] 2.4 Write `migrations/0001_init.sql` with the `links` and `progress` tables and the `idx_links_last_active` index, exactly as specified in the PRD
  - [x] 2.5 Apply the migration locally and confirm both tables exist
  - [x] 2.6 Install and configure Vitest with `@cloudflare/vitest-pool-workers`; add a trivial passing test to prove the harness runs against D1
  - [ ] 2.7 Deploy a hello-world page to Workers and confirm it serves
  - [ ] 2.8 Point the `taptospell.com` domain at the Worker and confirm TLS resolves

- [x] **3.0 Build the content pipeline for word lists and images**
  - [x] 3.1 Define the word entry type in `src/data/words/schema.ts`: `word`, `grade`, `difficulty` (`easy` | `medium` | `hard`), `picturable` (boolean), `frequencyRank`, `phoneticGroup`
  - [x] 3.2 Transcribe the Dolch lists into `grade-k.json` through `grade-3.json`, one file per grade, marking each word's `picturable` flag
  - [x] 3.3 Assign a difficulty tier to every word: easy for 2–3 letters, medium for 4–5, hard for 6+, then hand-adjust any word whose spelling is harder than its length suggests, such as "said" or "because"
  - [x] 3.4 Write `src/data/words/README.md` explaining how to append a word to a grade file and what each field means, so the lists can grow without reading the code
  - [x] 3.5 Write `scripts/validate-words.ts` to check every entry against the schema, flag duplicates across grades, and list picturable words with no generated image
  - [x] 3.6 Write `scripts/generate-images.ts` calling the Gemini image API with a single fixed style prompt reused for every word
  - [ ] 3.7 Lock the image style prompt before bulk generation — generate 10 sample words first, review them side by side, and only then run the full set
  - [x] 3.8 Generate images in batches with retry handling rather than one long loop, so a mid-run failure does not cost the whole run
  - [x] 3.9 Output all images as `.webp` at a single resolution into `public/images/words/`
  - [ ] 3.10 Review every generated image manually and regenerate any that are ambiguous, unsettling, or depict the wrong noun. This cannot be skipped — a wrong or odd picture in front of a 6-year-old is worse than a missing one
  - [x] 3.11 Add a CI step running `validate-words.ts` so a word added without an image fails the build

- [x] **4.0 Implement the practice link system**
  - [x] 4.1 Write `src/lib/slug.ts` generating 10-character slugs from `abcdefghjkmnpqrstuvwxyz23456789`
  - [x] 4.2 Add collision checking: query `links` and regenerate if the slug exists
  - [x] 4.3 Write tests covering alphabet correctness, length, and the collision-retry path
  - [x] 4.4 Build `POST /api/links`: accepts a grade, returns three candidate slugs without persisting them
  - [x] 4.5 Extend the endpoint to persist the chosen slug with its grade, optional label, and timestamps
  - [x] 4.6 Build `GET /api/links/:slug` resolving a slug to its grade and label
  - [x] 4.7 Write `src/lib/rate-limit.ts` capping slug lookups at 20 per minute per IP, returning 429 beyond that
  - [x] 4.8 Make the invalid-slug response identical for never-existed and expired slugs
  - [x] 4.9 Build the home page per the reviewed Screen 1 mockup: grade picker and create button
  - [x] 4.10 Build the slug choice and label screen per the reviewed Screen 2 mockup
  - [x] 4.11 Add a validation guard rejecting any attempt to supply a slug in the create request — slugs are server-generated only
  - [x] 4.12 Build `src/workers/expire-links.ts` deleting links and their progress rows after 12 months of inactivity; register it as a daily cron trigger
  - [x] 4.13 Write a test proving the expiry job deletes the right rows and leaves active links untouched

- [x] **5.0 Implement reading mode**
  - [x] 5.1 Write `src/lib/words.ts` selecting 10 words for a session: previously-missed words first, then unseen words, ordered by `frequencyRank` within `phoneticGroup`
  - [x] 5.2 Write tests for selection, covering a fresh link, a link with missed words, and a link that has seen every word in its grade
  - [x] 5.3 Build `ReadingSession.tsx` per the reviewed Screen 3 mockup, presenting one word at a time
  - [x] 5.4 Build `ProgressBar.tsx` as a fill-only bar with no numeric output of any kind
  - [x] 5.5 Wire the session to `$slug.tsx` so opening a link starts practice immediately — no splash, no start button, no interstitial
  - [x] 5.6 Hold mid-session state in `localStorage` via `local-state.ts` so a refresh does not lose the round
  - [x] 5.7 Verify the whole flow on a phone-width viewport before moving on

- [x] **6.0 Implement writing mode**
  - [x] 6.1 Write `src/lib/letter-bank.ts` building the bank from the answer's letters plus scaled distractors: 4 for 3–4 letter words, 3 for 5–6, 2 for 7+
  - [x] 6.2 Draw distractors from letters not in the answer, then shuffle the whole bank
  - [x] 6.3 Write tests for each length band, confirming the distractor count and that no distractor duplicates an answer letter
  - [x] 6.4 Build `AlphabetKeyboard.tsx` with tiles in alphabetical order, each at least 48×48 CSS pixels with 8px minimum spacing
  - [x] 6.5 Build `WritingSession.tsx` per the reviewed Screen 4 mockup: image on top, one empty box per letter, bank beneath
  - [x] 6.6 Implement the correct-letter path: fill the next empty box, visually consume the tile
  - [x] 6.7 Implement the incorrect-letter path per the reviewed Screen 5 mockup: shake the tile, return it to the bank. No counter, no score change, no attempt limit
  - [x] 6.8 Implement difficulty progression — ascending word length first, then removal of the pre-filled first-letter hint
  - [x] 6.9 Restrict writing mode to words where `picturable` is true
  - [x] 6.10 Confirm no interface element anywhere in this mode communicates failure — no red X, no buzzer, no "Wrong"

- [x] **7.0 Implement the audio system**
  - [x] 7.1 Create `public/sounds/success/` and `public/sounds/retry/` and add the supplied files, 1–5 per set
  - [x] 7.2 Write `scripts/validate-sounds.ts` confirming each set holds between 1 and 5 files in a playable format, and wire it into CI
  - [x] 7.3 Write `src/lib/audio.ts` with a pure selection function: given a set and the last-played file, return a random file that is not the last one. Keep it free of direct DOM calls so it is testable without a browser
  - [x] 7.4 Write tests for selection covering a one-file set, which must return that file every time rather than failing the no-repeat rule, and a five-file set, which must never return the same file twice consecutively
  - [x] 7.5 Add set discovery so the code reads whatever files are present rather than hard-coding filenames, allowing sets to change without a code change
  - [x] 7.6 Preload both sets at session start so playback lands on the tap, not after it
  - [x] 7.7 Initialise the audio context on the child's first interaction, since mobile browsers block earlier auto-play
  - [x] 7.8 Make every failure path silent: an empty set, a missing file, a decode error, or a blocked context must let interaction continue with no error shown to the child
  - [x] 7.9 Write tests for the empty-set and load-failure paths, asserting the caller is unaffected
  - [x] 7.10 Build `MuteToggle.tsx` and place it on every practice screen, persisting the preference per device through `local-state.ts`
  - [x] 7.11 Wire the success set into reading mode on a correct answer
  - [ ] 7.12 Wire the success set into writing mode. **Blocked on PRD open question 6** — one sound per correctly placed letter, or one sound on word completion. Do not implement until answered; eight sounds in three seconds may be noise rather than reward
  - [x] 7.13 Wire the retry set into both modes on an incorrect answer
  - [ ] 7.14 Listen to the retry set as a child would, several misses in a row on the same word. If it starts to feel like the app is enjoying the mistake, replace the file. Playful is the brief; mocking is out of scope

- [x] **8.0 Implement session completion, progress persistence, and the parent view**
  - [x] 8.1 Build `CelebrationScreen.tsx` per the reviewed Screen 6 mockup
  - [x] 8.2 Add the two options, equally weighted, neither pre-selected: "One more round" and "All done"
  - [x] 8.3 Wire "One more round" to start a fresh 10-item session in the same mode
  - [x] 8.4 Wire "All done" to a simple home screen showing the link's overall progress bar
  - [x] 8.5 Confirm nothing auto-starts a new session under any condition
  - [x] 8.6 Write `src/lib/progress.ts` with a single batched upsert of all 10 results, called once at session end — never per word
  - [x] 8.7 Build `POST /api/progress` accepting the batch and updating `links.last_active`
  - [x] 8.8 Write a test asserting one completed session produces exactly one database round trip
  - [x] 8.9 Wrap every `localStorage` access in `local-state.ts` in try/catch and test the throw path explicitly — a private-browsing exception must not blank the screen
  - [x] 8.10 Build `ParentView.tsx` per the reviewed Screen 7 mockup, at `?parent`
  - [x] 8.11 Add a copy-link control to the parent view
  - [x] 8.12 Verify the parent view exposes nothing identifying beyond the parent's own label

- [ ] **9.0 Add analytics and compliance artifacts**
  - [ ] 9.1 Add Plausible or self-hosted Umami. Do not add Google Analytics
  - [ ] 9.2 Write `src/lib/analytics.ts` emitting exactly four events: `session_start`, `session_complete`, `word_attempt`, `parent_view_open`
  - [ ] 9.3 Audit every event payload to confirm it carries no name, label, IP, or identifier beyond the slug
  - [ ] 9.4 Write `public/privacy.html` stating plainly that no personal information is collected from children
  - [ ] 9.5 Write `docs/data-retention-policy.md` naming the 12-month inactivity period, as the amended COPPA Rule requires
  - [ ] 9.6 Grep the built bundle for third-party script tags and confirm none load
  - [ ] 9.7 Confirm no field anywhere in the product accepts a child's name, age, birthday, school, or photo
  - [ ] 9.8 Verify Google's current terms permit commercial use of Gemini-generated images, and record the finding alongside the retention policy
  - [ ] 9.9 Confirm the audio files carry a licence permitting commercial use, or that they are your own work

---

## Notes on scope and sequencing

Task 1.0 blocks everything that renders a screen. The mockups exist to catch layout problems before code, so 4.9, 4.10, 5.3, 6.5, 6.7, 8.1 and 8.10 all build against the reviewed mockups rather than the written descriptions.

Tasks 2.0 through 4.0 must complete before 5.0, because reading mode depends on both the word pipeline and link routing. Task 6.0 depends on 3.0 for images. Task 7.0 depends on 5.0 and 6.0 existing, since it wires into both. Task 8.0 depends on 5.0 and 6.0. Task 9.0 can run in parallel with 8.0.

Sub-task 7.12 is blocked on an unanswered PRD question and should be left incomplete until that is resolved.

Tasks 0.0 through 8.0 constitute the minimum launchable subset. Task 9.0 must also ship before public launch, because the compliance artifacts are not optional.

Audio adds roughly 4–6 hours to the 70-hour estimate, and the mockup pass adds 3–4. Launch remains achievable for January 4, 2027, but the buffer is now thinner.
