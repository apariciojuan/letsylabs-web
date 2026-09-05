import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  WATCHED_TERMS,
  PAGE_LABEL_TO_PATH,
  findWatchedTermHits,
  hasTargetMarker,
  routeFromDistRelativePath,
  parseClaimsMatrix,
  findMissingRowProblems,
  findMissingTargetMarkerProblems,
  findBlockingRows,
} from './check_claims.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkClaimsMjs = path.join(scriptsDir, 'check_claims.mjs');

function run(fixtureName, { production = false } = {}) {
  const fixtureDir = path.join(scriptsDir, 'fixtures', fixtureName);
  const distDir = path.join(fixtureDir, 'dist');
  const matrixPath = path.join(fixtureDir, 'matrix.md');
  return spawnSync('node', [checkClaimsMjs, distDir, matrixPath], {
    encoding: 'utf8',
    env: { ...process.env, PUBLIC_SITE_ENV: production ? 'production' : '' },
  });
}

describe('findWatchedTermHits (logic unit)', () => {
  it('finds an alphabetic term on a word boundary, case-insensitive', () => {
    expect(findWatchedTermHits('<p>Built for Production use.</p>')).toContain('production');
  });

  it('does NOT match "everything"/"everywhere" as the watched term "every" (W-9 finding)', () => {
    expect(findWatchedTermHits('<p>Self-host everything, works everywhere.</p>')).toEqual([]);
  });

  it('matches "every" as its own word', () => {
    expect(findWatchedTermHits('<p>Every call is a session.</p>')).toContain('every');
  });

  it('finds numeric/symbol terms literally, entity-decoded first ("&lt;1s" -> "<1s")', () => {
    expect(findWatchedTermHits('<div>&lt;1s voice-to-voice</div>')).toContain('<1s');
    expect(findWatchedTermHits('<div>STT &lt;300ms partial</div>')).toContain('<300ms');
  });

  it('finds "available now" across whitespace variations', () => {
    expect(findWatchedTermHits('<p>Available   now.</p>')).toContain('available now');
  });

  it('returns [] when no watched term is present', () => {
    expect(findWatchedTermHits('<p>Bring your own intelligence.</p>')).toEqual([]);
  });
});

describe('hasTargetMarker (logic unit)', () => {
  it('finds data-claim-state="target" with either quote style', () => {
    expect(hasTargetMarker('<span data-claim-state="target">TARGET</span>')).toBe(true);
    expect(hasTargetMarker("<span data-claim-state='target'>TARGET</span>")).toBe(true);
  });

  it('is false when absent', () => {
    expect(hasTargetMarker('<span class="badge">TARGET</span>')).toBe(false);
  });
});

describe('routeFromDistRelativePath (logic unit)', () => {
  it('maps the home page in both locales', () => {
    expect(routeFromDistRelativePath('index.html')).toBe('/');
    expect(routeFromDistRelativePath('es/index.html')).toBe('/');
  });

  it('maps a nested page in both locales', () => {
    expect(routeFromDistRelativePath('voice/index.html')).toBe('/voice');
    expect(routeFromDistRelativePath('es/voice/index.html')).toBe('/voice');
  });

  it('returns null for non-page files', () => {
    expect(routeFromDistRelativePath('sitemap.xml')).toBeNull();
    expect(routeFromDistRelativePath('og/home-en.png')).toBeNull();
  });
});

describe('parseClaimsMatrix (logic unit)', () => {
  it('parses the fixture matrix into rows with page(s) and normalized estado', () => {
    const markdown = readFileSync(path.join(scriptsDir, 'fixtures/claims_ok/matrix.md'), 'utf8');
    const rows = parseClaimsMatrix(markdown);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({
      afirmacion: '"Ships to production." (Home)',
      pages: ['Home'],
      estado: 'bloqueante',
    });
    expect(rows[1].estado).toBe('target');
  });

  it('splits a multi-page cell ("Home, Telephony") into two pages', () => {
    const rows = parseClaimsMatrix(
      '| Afirmación | Página | Respaldo | Estado |\n' +
        '| --- | --- | --- | --- |\n' +
        '| "x" | Home, Telephony | none | `bloqueante` |\n',
    );
    expect(rows[0].pages).toEqual(['Home', 'Telephony']);
  });

  it('treats a non-backtick Estado cell as informational (estado: null)', () => {
    const rows = parseClaimsMatrix(
      '| Afirmación | Página | Respaldo | Estado |\n' +
        '| --- | --- | --- | --- |\n' +
        '| "x" | Home | none | anotado (no bloqueante) |\n',
    );
    expect(rows[0].estado).toBeNull();
  });

  it('every PAGE_LABEL_TO_PATH value starts with "/"', () => {
    for (const routePath of Object.values(PAGE_LABEL_TO_PATH)) {
      expect(routePath.startsWith('/')).toBe(true);
    }
  });
});

describe('findMissingRowProblems (logic unit, CU-W9-1)', () => {
  it('flags a watched term on a page with zero matrix rows', () => {
    const matrixRows = [{ afirmacion: 'x', pages: ['Voice'], estado: 'bloqueante' }];
    const distFiles = [{ relativePath: 'index.html', html: '<p>Never locked in.</p>' }];
    const problems = findMissingRowProblems(distFiles, matrixRows);
    expect(problems).toEqual([{ term: 'never', route: '/', file: 'index.html' }]);
  });

  it('does not flag a term on a page that already has a row (any row, not necessarily quoting the term)', () => {
    const matrixRows = [{ afirmacion: 'x', pages: ['Home'], estado: 'bloqueante' }];
    const distFiles = [{ relativePath: 'index.html', html: '<p>Never locked in.</p>' }];
    expect(findMissingRowProblems(distFiles, matrixRows)).toEqual([]);
  });
});

describe('findMissingTargetMarkerProblems (logic unit, CU-W9-2)', () => {
  it('flags a target-row page whose HTML has no data-claim-state="target" element', () => {
    const matrixRows = [{ afirmacion: 'x', pages: ['Home'], estado: 'target' }];
    const distFiles = [{ relativePath: 'index.html', html: '<p>20ms audio frames</p>' }];
    expect(findMissingTargetMarkerProblems(distFiles, matrixRows)).toEqual([
      { route: '/', file: 'index.html' },
    ]);
  });

  it('passes when the marker is present', () => {
    const matrixRows = [{ afirmacion: 'x', pages: ['Home'], estado: 'target' }];
    const distFiles = [
      { relativePath: 'index.html', html: '<span data-claim-state="target">20ms</span>' },
    ];
    expect(findMissingTargetMarkerProblems(distFiles, matrixRows)).toEqual([]);
  });
});

describe('findBlockingRows (logic unit, CU-W9-4)', () => {
  it('returns only the bloqueante rows', () => {
    const matrixRows = [
      { afirmacion: 'a', pages: ['Home'], estado: 'bloqueante' },
      { afirmacion: 'b', pages: ['Home'], estado: 'target' },
      { afirmacion: 'c', pages: ['Home'], estado: null },
    ];
    expect(findBlockingRows(matrixRows)).toEqual([matrixRows[0]]);
  });
});

describe('check_claims.mjs (CLI)', () => {
  it('passes (exit 0) when every term has a row and every target row has its marker', () => {
    const result = run('claims_ok');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails (exit 1) when a watched term is found on a page with no row (CU-W9-1)', () => {
    const result = run('claims_missing_row');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('watched term "never"');
    expect(result.stderr).toContain('no row in');
  });

  it('fails (exit 1) when a target row has no data-claim-state="target" in its page (CU-W9-2)', () => {
    const result = run('claims_target_no_badge');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('data-claim-state="target"');
  });

  it('passes in development even with a `bloqueante` row (CU-W9-4, dev is not blocked)', () => {
    const result = run('claims_blocking', { production: false });
    expect(result.status).toBe(0);
  });

  it('fails (exit 1) with PUBLIC_SITE_ENV=production and a `bloqueante` row present (CU-W9-4)', () => {
    const result = run('claims_blocking', { production: true });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('[production] bloqueante row');
    expect(result.stderr).toContain('Ships to production.');
  });

  it('the (c) production check does not require dist/ to exist (claims_blocking has none)', () => {
    const result = run('claims_blocking', { production: true });
    expect(result.stdout + result.stderr).toContain('does not exist yet');
  });

  it('every WATCHED_TERMS entry is documented and non-empty', () => {
    expect(WATCHED_TERMS.length).toBeGreaterThan(0);
    for (const term of WATCHED_TERMS) expect(term.length).toBeGreaterThan(0);
  });
});
