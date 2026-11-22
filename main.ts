// Aetherbound: Runes of the Void - Hand-in Entrypoint (Node 22 Standard Library)
// Author: Devansh Shukla
// Copies game/ and screenshots/ to $MAKEFUN_OUTPUT_DIR (or /output) and generates dossier.json.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Ensure output directories exist
mkdirSync(out, { recursive: true });
const gameOut = join(out, 'game');
const screenshotsOut = join(out, 'screenshots');

mkdirSync(gameOut, { recursive: true });
mkdirSync(screenshotsOut, { recursive: true });

// Copy game assets and code
cpSync(join(here, 'game'), gameOut, { recursive: true });

// Copy screenshots if present
const screenshotsSrc = join(here, 'screenshots');
if (existsSync(screenshotsSrc)) {
  cpSync(screenshotsSrc, screenshotsOut, { recursive: true });
}

// Generate the official dossier for the AI judge
const dossierContent = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossierContent);
console.log('Aetherbound hand-in packaged successfully to', out);
console.log('Dossier generated with byte length:', dossierContent.length);
