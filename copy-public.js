import pkg from 'fs-extra';
const { copy, existsSync } = pkg;
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Copy public directory to dist
await copy('public', 'dist', {
    filter: (src, dest) => {
        // Don't copy if the file already exists in dist
        return !existsSync(dest);
    }
});

console.log('Public directory copied to dist successfully!');