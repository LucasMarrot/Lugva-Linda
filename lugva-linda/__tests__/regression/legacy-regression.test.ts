import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['actions', 'lib', 'data'];
const FORBIDDEN_PATTERNS = ['language.userId', 'word.userId'];

const listFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(absolute));
      continue;
    }

    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(absolute);
    }
  }

  return files;
};

describe('legacy regression checks', () => {
  it('no backend ownership checks use legacy userId fields', () => {
    const files = TARGET_DIRS.flatMap((dir) => listFiles(path.join(ROOT, dir)));

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(content.includes(pattern)).toBe(false);
      }
    }
  });
});
