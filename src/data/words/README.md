# Word Lists (`src/data/words/`)

Each JSON file in this directory holds the word list for one grade level:

| File | Grade Integer | Label |
| --- | --- | --- |
| `grade-pre-k.json` | `0` | Pre-K (Dolch Pre-Primer + Nouns) |
| `grade-k.json` | `1` | Kindergarten (Dolch Primer + Nouns) |
| `grade-1.json` | `2` | 1st Grade |
| `grade-2.json` | `3` | 2nd Grade |
| `grade-3.json` | `4` | 3rd Grade |

## Schema Fields (`src/data/words/schema.ts`)

Every entry must satisfy `WordEntry`:

- **`word`** (`string`): Lowercase letters only (`a-z`). Must be unique across all grade files.
- **`grade`** (`0 | 1 | 2 | 3 | 4`): Integer grade matching the file it belongs to.
- **`difficulty`** (`"easy" | "medium" | "hard"`):
  - Default rule: `easy` for 2–3 letters, `medium` for 4–5 letters, `hard` for 6+ letters.
  - Hand-adjust irregular words whose spelling is harder than their length suggests (e.g., `"said"`, `"one"`, `"two"`, `"eye"`).
- **`picturable`** (`boolean`): `true` only for concrete nouns that can be unambiguously illustrated for a 5–8 year old. Writing mode draws exclusively from `picturable: true` words.
- **`frequencyRank`** (`number`): Positive integer (`>= 1`) ordering words within a grade from most common (`1`) to least common.
- **`phoneticGroup`** (`string`): Non-empty phonetic pattern tag (e.g., `"short-a"`, `"long-e"`, `"r-controlled"`, `"irregular"`).

## How to Add a Word

1. Append the new JSON object to the appropriate `grade-*.json` file.
2. If `"picturable": true`, generate or place its illustration at `public/images/words/<word>.webp` (`npx tsx scripts/generate-images.ts --word <word>`).
3. Run `npm run validate:words` (`npx tsx scripts/validate-words.ts`) to verify schema compliance, uniqueness across grades, and image presence.

