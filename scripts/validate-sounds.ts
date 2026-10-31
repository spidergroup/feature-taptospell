import fs from 'node:fs';
import path from 'node:path';

const SOUNDS_ROOT = path.resolve(process.cwd(), 'public/sounds');
const SOUND_SETS = ['success', 'retry'] as const;
const PLAYABLE_EXTENSIONS = new Set(['.mp3', '.wav', '.ogg', '.webm']);

export interface SoundValidationResult {
  valid: boolean;
  errors: string[];
  sets: Record<string, string[]>;
}

export function validateSoundSets(soundsRoot = SOUNDS_ROOT): SoundValidationResult {
  const errors: string[] = [];
  const sets: Record<string, string[]> = {};

  for (const setName of SOUND_SETS) {
    const dirPath = path.join(soundsRoot, setName);
    if (!fs.existsSync(dirPath)) {
      errors.push(`Missing sound set directory: public/sounds/${setName}`);
      sets[setName] = [];
      continue;
    }

    const entries = fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((d) => d.isFile() && !d.name.startsWith('.'));

    const playableFiles: string[] = [];
    for (const file of entries) {
      const ext = path.extname(file.name).toLowerCase();
      if (!PLAYABLE_EXTENSIONS.has(ext)) {
        errors.push(`Unsupported audio format in ${setName}: ${file.name}`);
        continue;
      }
      const stat = fs.statSync(path.join(dirPath, file.name));
      if (stat.size === 0) {
        errors.push(`Empty audio file in ${setName}: ${file.name}`);
        continue;
      }
      playableFiles.push(file.name);
    }

    sets[setName] = playableFiles;
    if (playableFiles.length < 1 || playableFiles.length > 5) {
      errors.push(
        `Sound set "${setName}" must contain between 1 and 5 playable files (found ${playableFiles.length})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sets,
  };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename);
if (isMain) {
  const res = validateSoundSets();
  for (const [setName, files] of Object.entries(res.sets)) {
    console.log(`Sound set "${setName}": ${files.length} file(s) [${files.join(', ')}]`);
  }
  if (!res.valid) {
    console.error('Sound validation failed:\n  - ' + res.errors.join('\n  - '));
    process.exit(1);
  }
}

