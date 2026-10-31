export const SLUG_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';
export const SLUG_LENGTH = 10;

const VALID_SLUG_REGEX = new RegExp(`^[${SLUG_ALPHABET}]{${SLUG_LENGTH}}$`);

export function isValidSlug(slug: unknown): slug is string {
  return typeof slug === 'string' && VALID_SLUG_REGEX.test(slug);
}

/**
 * Generates a single 10-character random slug from the unambiguous 31-character alphabet.
 */
export function generateRandomSlug(randomBytesFn?: (length: number) => Uint8Array): string {
  const bytes = randomBytesFn
    ? randomBytesFn(SLUG_LENGTH)
    : crypto.getRandomValues(new Uint8Array(SLUG_LENGTH));

  let result = '';
  for (let i = 0; i < SLUG_LENGTH; i++) {
    result += SLUG_ALPHABET[bytes[i] % SLUG_ALPHABET.length];
  }
  return result;
}

/**
 * Checks whether a slug already exists in the D1 `links` table.
 */
export async function slugExists(db: D1Database, slug: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 AS found FROM links WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first<{ found: number }>();
  return Boolean(row);
}

/**
 * Generates a unique slug, retrying if a collision is detected in `links`.
 */
export async function generateUniqueSlug(
  db: D1Database,
  generator: () => string = () => generateRandomSlug(),
  maxAttempts = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = generator();
    const exists = await slugExists(db, candidate);
    if (!exists) {
      return candidate;
    }
  }
  throw new Error(`Failed to generate a unique slug after ${maxAttempts} attempts`);
}

/**
 * Generates N distinct unique candidate slugs that do not collide with D1 or each other.
 */
export async function generateCandidateSlugs(
  db: D1Database,
  count = 3,
  generator: () => string = () => generateRandomSlug()
): Promise<string[]> {
  const candidates: string[] = [];
  const chosenSet = new Set<string>();

  while (candidates.length < count) {
    const slug = await generateUniqueSlug(db, generator);
    if (!chosenSet.has(slug)) {
      chosenSet.add(slug);
      candidates.push(slug);
    }
  }

  return candidates;
}

