import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP_ROOT = join(process.cwd(), 'sources', 'app');

describe('expo-router app directory hygiene', () => {
    it('does not contain Vitest route files', () => {
        expect(findRouteTests(APP_ROOT)).toEqual([]);
    });

    it('does not contain non-route ts helper modules', () => {
        expect(findPlainTsModules(APP_ROOT)).toEqual([]);
    });
});

function findRouteTests(rootDir: string): string[] {
    const results: string[] = [];
    walk(rootDir, rootDir, results);
    return results.sort();
}

function findPlainTsModules(rootDir: string): string[] {
    const results: string[] = [];
    walk(rootDir, rootDir, results, (entry) => {
        if (!entry.endsWith('.ts') || entry.endsWith('.d.ts')) {
            return false;
        }

        return entry !== '_layout.ts' && entry !== '+middleware.ts' && entry !== '+not-found.ts';
    });
    return results.sort();
}

function walk(
    currentDir: string,
    rootDir: string,
    results: string[],
    matcher: (relativePath: string) => boolean = (entry) => /\.(test|spec)\.(ts|tsx)$/.test(entry),
) {
    for (const entry of readdirSync(currentDir)) {
        const absolutePath = join(currentDir, entry);
        const stats = statSync(absolutePath);
        if (stats.isDirectory()) {
            walk(absolutePath, rootDir, results, matcher);
            continue;
        }

        const relativePath = absolutePath.slice(rootDir.length + 1);
        if (matcher(relativePath)) {
            results.push(relativePath);
        }
    }
}
