import pkg from 'fs-extra';
const { copy } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Copy public directory to dist, overwriting existing files
await copy('public', 'dist', { overwrite: true });

console.log('Public directory copied to dist successfully!');