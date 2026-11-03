# Spelling Levels Configuration

`src/data/levels/spelling.json` defines the 5 levels for Spelling Mode in TapToSpell. All level parameters are read from this file at runtime and build time — changing a value here changes behaviour without modifying code.

## Fields

| Field | Type | Description |
| --- | --- | --- |
| `id` | `1 \| 2 \| 3 \| 4 \| 5` | Level number (must contain all 5 levels 1..5). |
| `name` | `string` | Friendly theme name displayed in the level pill badge (e.g. `"Spelling Safari"`). |
| `icon` | `string` | Material Symbols icon name shown alongside the level badge (e.g. `"pets"`). |
| `wordLength` | `{ min: number, max: number }` | Inclusive minimum and maximum word lengths drawn at this level. |
| `difficulty` | `Array<"easy" \| "medium" \| "hard">` | Difficulty tiers included at this level. |
| `questionsPerRound` | `number` | Number of words presented per round. |
| `prefillFirstLetter` | `boolean` | When `true`, the first letter box starts pre-filled and locked, and 1 hint bulb starts used. |
| `distractors` | `number` (optional) | Overrides the default length-based distractor tile count (`4` for 3–4 letters, `3` for 5–6, `2` for 7+). |
| `pointsPerWord` | `number` | Stars awarded for each completed word at this level. |
| `wordsToAdvance` | `number` | Number of mastered words required at this level before advancing to the next level at the end of a round. |

## Validation

Run `npx tsx scripts/validate-levels.ts` to verify the JSON file against the schema and check picturable word coverage across grades.

