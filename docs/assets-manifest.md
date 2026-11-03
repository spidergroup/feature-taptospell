# TapToSpell — Assets Manifest & Generation Guide

This document lists every image and sound asset required by **TapToSpell**, complete with exact project paths, file specifications, and AI generation prompts.

---

## 1. Quick Asset Summary

| Asset Category | Target Path | Quantity | Format / Specs | Status |
| --- | --- | --- | --- | --- |
| **Picturable Word Illustrations** | `public/images/words/{word}.webp` | 60 total (59 needed) | 512×512 WebP, 1:1 square | 1 existing (`cat.webp`), **59 to create** |
| **Word Spoken Audio** | `public/sounds/words/{word}.mp3` | 130 total | MP3, 44.1kHz, 128kbps, ~1–1.5s clear voice | **130 to create** (60 spelling + 70 sight) |
| **Success Sound Chimes** | `public/sounds/success/` | 2–5 files | MP3, celebratory, pleasant chime | 2 existing, up to 3 optional additions |
| **Retry / Wobble Sounds** | `public/sounds/retry/` | 2–5 files | MP3, gentle playful wobble (no buzzer) | 2 existing, up to 3 optional additions |

---

## 2. Picturable Word Images to Create (59 Files)

### Shared Image Generation Style Prompt
Locked per PRD Section 6.1 and `scripts/generate-images.ts`:
> *"Clean mobile-first web app illustration for young children, flat vector illustration style, soft rounded corners, generous whitespace, warm pastel palette of cream background with teal and coral accents, no gradients, no drop shadows, no clutter, no text or letters anywhere in the image. Single clear centered illustration of a friendly {WORD}"*

### File Specifications
* **Format:** WebP (`.webp`)
* **Resolution:** 512×512 px (1:1 square aspect ratio)
* **Directory:** `public/images/words/`

### Asset List by Grade

#### Pre-K (11 missing)
| Word | Target File Path | Difficulty | Prompt Object |
| :--- | :--- | :--- | :--- |
| **dog** | `public/images/words/dog.webp` | easy | a friendly happy golden puppy sitting down |
| **pig** | `public/images/words/pig.webp` | easy | a cute friendly pink piglet |
| **sun** | `public/images/words/sun.webp` | easy | a smiling warm yellow cartoon sun with soft rays |
| **bed** | `public/images/words/bed.webp` | easy | a cozy wooden kid bed with a soft pillow and blanket |
| **box** | `public/images/words/box.webp` | easy | a friendly open cardboard toy box |
| **car** | `public/images/words/car.webp` | easy | a cheerful rounded toy car |
| **cow** | `public/images/words/cow.webp` | easy | a cute spotted dairy cow standing in a grassy meadow |
| **toy** | `public/images/words/toy.webp` | easy | a wooden toy spinning top and building blocks |
| **ball** | `public/images/words/ball.webp` | easy | a bright colorful bouncing beach ball |
| **book** | `public/images/words/book.webp` | easy | a colorful open picture book with blank pages |
| **fish** | `public/images/words/fish.webp` | medium | a cheerful little orange goldfish swimming |

*(Note: `public/images/words/cat.webp` already exists)*

#### Kindergarten (12 missing)
| Word | Target File Path | Difficulty | Prompt Object |
| :--- | :--- | :--- | :--- |
| **leg** | `public/images/words/leg.webp` | easy | a cartoon child leg wearing a bright sneaker shoe |
| **egg** | `public/images/words/egg.webp` | easy | a smooth speckled bird egg in a soft cup |
| **top** | `public/images/words/top.webp` | easy | a classic spinning wooden toy top |
| **hat** | `public/images/words/hat.webp` | easy | a colorful cheerful sun hat |
| **duck** | `public/images/words/duck.webp` | easy | a friendly yellow rubber ducky swimming |
| **frog** | `public/images/words/frog.webp` | medium | a cute smiling green tree frog sitting on a lilypad |
| **milk** | `public/images/words/milk.webp` | medium | a cold glass bottle of fresh milk with a paper straw |
| **tree** | `public/images/words/tree.webp` | medium | a full green oak tree with a sturdy brown trunk |
| **cake** | `public/images/words/cake.webp` | medium | a birthday strawberry sponge cake with frosting |
| **bird** | `public/images/words/bird.webp` | medium | a friendly blue songbird perched on a twig |
| **boat** | `public/images/words/boat.webp` | medium | a small wooden sailboat floating on gentle ripples |
| **apple** | `public/images/words/apple.webp` | medium | a shiny crisp red apple with a small green leaf |

#### 1st Grade (12 missing)
| Word | Target File Path | Difficulty | Prompt Object |
| :--- | :--- | :--- | :--- |
| **bell** | `public/images/words/bell.webp` | easy | a golden hand bell ringing softly |
| **hand** | `public/images/words/hand.webp` | easy | a waving cartoon hand with palm open |
| **hill** | `public/images/words/hill.webp` | easy | a gentle rolling green grassy hill under blue sky |
| **nest** | `public/images/words/nest.webp` | easy | a cozy twig bird nest with three small eggs |
| **ring** | `public/images/words/ring.webp` | easy | a shiny golden ring with a small sparkling blue gem |
| **coat** | `public/images/words/coat.webp` | medium | a cozy warm yellow winter jacket coat with buttons |
| **corn** | `public/images/words/corn.webp` | medium | a sweet golden yellow ear of corn on the cob |
| **drum** | `public/images/words/drum.webp` | medium | a colorful marching snare drum with two wooden drumsticks |
| **farm** | `public/images/words/farm.webp` | medium | a classic red barn with a white wooden fence |
| **shoe** | `public/images/words/shoe.webp` | medium | a cheerful red canvas sneaker shoe with white laces |
| **chair** | `public/images/words/chair.webp` | medium | a sturdy wooden armchair with a soft cushion |
| **horse** | `public/images/words/horse.webp` | medium | a friendly galloping brown pony horse with a dark mane |

#### 2nd Grade (12 missing)
| Word | Target File Path | Difficulty | Prompt Object |
| :--- | :--- | :--- | :--- |
| **bear** | `public/images/words/bear.webp` | medium | a friendly cuddly brown teddy bear sitting upright |
| **door** | `public/images/words/door.webp` | medium | a colorful welcoming front door with a brass doorknob |
| **feet** | `public/images/words/feet.webp` | medium | cute cartoon footprints on sand |
| **wind** | `public/images/words/wind.webp` | medium | a gentle swirl of autumn wind with drifting leaves |
| **wood** | `public/images/words/wood.webp` | medium | stacked natural campfire logs of split birch wood |
| **bread** | `public/images/words/bread.webp` | medium | a fresh golden loaf of sliced bakery bread |
| **clock** | `public/images/words/clock.webp` | medium | a classic circular wall clock showing 3 o'clock |
| **grass** | `public/images/words/grass.webp` | medium | a patch of vibrant green spring lawn blades with morning dew |
| **house** | `public/images/words/house.webp` | medium | a cozy storybook cottage house with a chimney and garden |
| **sheep** | `public/images/words/sheep.webp` | medium | a fluffy white woolly lamb sheep grazing |
| **table** | `public/images/words/table.webp` | medium | a simple four-legged wooden dining table |
| **flower** | `public/images/words/flower.webp` | hard | a blooming bright yellow sunflower with green leaves |

#### 3rd Grade (12 missing)
| Word | Target File Path | Difficulty | Prompt Object |
| :--- | :--- | :--- | :--- |
| **eye** | `public/images/words/eye.webp` | easy | a friendly cartoon eye looking gently forward |
| **ship** | `public/images/words/ship.webp` | medium | a grand wooden sailing explorer ship on ocean waters |
| **snow** | `public/images/words/snow.webp` | medium | delicate symmetrical winter snowflakes falling |
| **song** | `public/images/words/song.webp` | medium | floating whimsical colorful musical notes and clefs |
| **rain** | `public/images/words/rain.webp` | medium | a small fluffy gray raincloud with clean blue raindrops |
| **seed** | `public/images/words/seed.webp` | medium | a tiny sunflower seed sprouting a fresh green shoot in soil |
| **watch** | `public/images/words/watch.webp` | medium | a colorful wrist watch with an analog face |
| **stick** | `public/images/words/stick.webp` | medium | a smooth natural fallen wooden tree branch |
| **water** | `public/images/words/water.webp` | medium | a sparkling clear drop of blue water creating gentle ripples |
| **paper** | `public/images/words/paper.webp` | hard | a clean blank sheet of letter paper with curled corner |
| **window** | `public/images/words/window.webp` | hard | an open bedroom window with sunny outdoor daylight |
| **garden** | `public/images/words/garden.webp` | hard | a lush backyard raised vegetable garden with carrots and flowers |

---

## 3. Word Spoken Audio to Create (`public/sounds/words/*.mp3`)

### Audio Specifications
* **Format:** MP3
* **Audio Specs:** 44.1 kHz, 128 kbps CBR, mono or stereo
* **Duration:** 0.8s to 1.5s per word
* **Voice Style:** Warm, encouraging, clear US-English phonics pronunciation (no background music, 50ms silence pad start/end).
* **Directory:** `public/sounds/words/`

### A. 60 Picturable Spelling Words
`apple.mp3`, `ball.mp3`, `bear.mp3`, `bed.mp3`, `bell.mp3`, `bird.mp3`, `boat.mp3`, `book.mp3`, `box.mp3`, `bread.mp3`, `cake.mp3`, `car.mp3`, `cat.mp3`, `chair.mp3`, `clock.mp3`, `coat.mp3`, `corn.mp3`, `cow.mp3`, `dog.mp3`, `door.mp3`, `drum.mp3`, `duck.mp3`, `egg.mp3`, `eye.mp3`, `farm.mp3`, `feet.mp3`, `fish.mp3`, `flower.mp3`, `frog.mp3`, `garden.mp3`, `grass.mp3`, `hand.mp3`, `hat.mp3`, `hill.mp3`, `horse.mp3`, `house.mp3`, `leg.mp3`, `milk.mp3`, `nest.mp3`, `paper.mp3`, `pig.mp3`, `rain.mp3`, `ring.mp3`, `seed.mp3`, `sheep.mp3`, `ship.mp3`, `shoe.mp3`, `snow.mp3`, `song.mp3`, `stick.mp3`, `sun.mp3`, `table.mp3`, `top.mp3`, `toy.mp3`, `tree.mp3`, `watch.mp3`, `water.mp3`, `wind.mp3`, `window.mp3`, `wood.mp3`

### B. 70 Non-Picturable Dolch Sight Words
`about.mp3`, `again.mp3`, `always.mp3`, `and.mp3`, `because.mp3`, `big.mp3`, `both.mp3`, `buy.mp3`, `can.mp3`, `could.mp3`, `cut.mp3`, `does.mp3`, `done.mp3`, `eight.mp3`, `every.mp3`, `fast.mp3`, `first.mp3`, `full.mp3`, `goes.mp3`, `good.mp3`, `had.mp3`, `have.mp3`, `he.mp3`, `her.mp3`, `him.mp3`, `his.mp3`, `hot.mp3`, `into.mp3`, `jump.mp3`, `laugh.mp3`, `light.mp3`, `look.mp3`, `many.mp3`, `myself.mp3`, `never.mp3`, `of.mp3`, `one.mp3`, `own.mp3`, `play.mp3`, `please.mp3`, `pretty.mp3`, `read.mp3`, `red.mp3`, `run.mp3`, `said.mp3`, `see.mp3`, `seven.mp3`, `she.mp3`, `some.mp3`, `that.mp3`, `the.mp3`, `their.mp3`, `them.mp3`, `then.mp3`, `there.mp3`, `they.mp3`, `to.mp3`, `try.mp3`, `two.mp3`, `us.mp3`, `use.mp3`, `want.mp3`, `warm.mp3`, `was.mp3`, `were.mp3`, `what.mp3`, `when.mp3`, `which.mp3`, `with.mp3`, `would.mp3`

---

## 4. Game UI Sound Effects Pool

### Success Chimes (`public/sounds/success/`)
* **Existing:**
  - `public/sounds/success/chime-1.mp3`
  - `public/sounds/success/chime-2.mp3`
* **Optional Additions (up to 3 more):**
  - `public/sounds/success/chime-3.mp3` (bright pentatonic harp glissando)
  - `public/sounds/success/chime-4.mp3` (warm xylophone chord resolution)
  - `public/sounds/success/chime-5.mp3` (magical sparkle chime)

### Retry Sounds (`public/sounds/retry/`)
* **Existing:**
  - `public/sounds/retry/boing-1.mp3`
  - `public/sounds/retry/boing-2.mp3`
* **Optional Additions (up to 3 more):**
  - `public/sounds/retry/boing-3.mp3` (gentle bubble pop)
  - `public/sounds/retry/boing-4.mp3` (soft cartoon woodblock wobble)
  - `public/sounds/retry/boing-5.mp3` (playful rubber band bounce)

---

## 5. Automated Generation Script Usage

### Run Built-in Imagen Generator
If you have a `GEMINI_API_KEY`:
```bash
# Generate sample images (limit 5)
GEMINI_API_KEY="your-key-here" npx tsx scripts/generate-images.ts --sample=5

# Generate all 59 missing images
GEMINI_API_KEY="your-key-here" npx tsx scripts/generate-images.ts

# Generate single specific word
GEMINI_API_KEY="your-key-here" npx tsx scripts/generate-images.ts --word=dog
```

### Validate Assets
To verify image coverage and sound pools at any time:
```bash
# Check all words and list any remaining missing images
npm run validate:words

# Check level constraints
npm run validate:levels

# Check success and retry sound sets
npm run validate:sounds
```

