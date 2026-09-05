import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { expectedOgImagePaths, findOgImageRefs, pngDimensions } from './check_og.mjs';
import { SITE_PATHS } from '../src/lib/site-routes.ts';
import { locales } from '../src/i18n/index.ts';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkOgMjs = path.join(scriptsDir, 'check_og.mjs');

/** Builds a minimal valid PNG buffer with the given IHDR width/height (1x1 image, deflate content). */
function fakePng(width, height) {
  function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4); // pngDimensions never validates the CRC, only IHDR's width/height
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  const idatData = zlib.deflateSync(Buffer.from([0, 0, 0, 0, 0])); // 1x1 RGBA scanline (filter+px)
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdrData),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

describe('pngDimensions', () => {
  it('reads width/height from a real PNG (1200x630)', () => {
    expect(pngDimensions(fakePng(1200, 630))).toEqual({ width: 1200, height: 630 });
  });

  it('reads a different size correctly', () => {
    expect(pngDimensions(fakePng(400, 300))).toEqual({ width: 400, height: 300 });
  });

  it('throws for a buffer that is not a valid PNG', () => {
    expect(() => pngDimensions(Buffer.from('not a png'))).toThrow(/not a valid PNG/);
  });
});

describe('expectedOgImagePaths', () => {
  it('lists one path per (page, locale) pair, matching src/lib/seo.ts', () => {
    const paths = expectedOgImagePaths();
    expect(paths.length).toBe(SITE_PATHS.length * locales.length);
    expect(paths).toContain('/og/home-en.png');
    expect(paths).toContain('/og/home-es.png');
    expect(paths).toContain('/og/self-host-en.png');
  });
});

describe('findOgImageRefs', () => {
  it('extracts the content of every og:image meta tag', () => {
    const html = '<meta property="og:image" content="https://letsylabs.com/og/voice-en.png">';
    expect(findOgImageRefs(html)).toEqual(['https://letsylabs.com/og/voice-en.png']);
  });

  it('returns an empty array when there is no og:image tag', () => {
    expect(findOgImageRefs('<meta property="og:title" content="x">')).toEqual([]);
  });
});

describe('check_og.mjs (CLI)', () => {
  let tmpDir;

  afterEach(() => {
    if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
  });

  function run(distDir) {
    return spawnSync('node', [checkOgMjs, distDir], { encoding: 'utf8' });
  }

  it('fails (exit 1) when an expected OG image is missing entirely', () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'check-og-'));
    const result = run(tmpDir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('/og/home-en.png: missing');
  });

  it('fails (exit 1) when an OG image exists but is the wrong size', () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'check-og-'));
    mkdirSync(path.join(tmpDir, 'og'));
    for (const p of expectedOgImagePaths()) {
      writeFileSync(path.join(tmpDir, p), fakePng(400, 300));
    }
    const result = run(tmpDir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('expected 1200x630, got 400x300');
  });

  it('fails (exit 1) when an HTML page references an og:image that does not exist', () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'check-og-'));
    mkdirSync(path.join(tmpDir, 'og'));
    for (const p of expectedOgImagePaths()) {
      writeFileSync(path.join(tmpDir, p), fakePng(1200, 630));
    }
    writeFileSync(
      path.join(tmpDir, 'index.html'),
      '<meta property="og:image" content="https://letsylabs.com/og/does-not-exist.png">',
    );
    const result = run(tmpDir);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('does not exist in dist');
  });

  it('passes (exit 0) when every expected image is present at 1200x630 and every reference resolves', () => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'check-og-'));
    mkdirSync(path.join(tmpDir, 'og'));
    for (const p of expectedOgImagePaths()) {
      writeFileSync(path.join(tmpDir, p), fakePng(1200, 630));
    }
    writeFileSync(
      path.join(tmpDir, 'index.html'),
      '<meta property="og:image" content="https://letsylabs.com/og/home-en.png">',
    );
    const result = run(tmpDir);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('passes (exit 0) when the dist dir does not exist yet', () => {
    const result = run(path.join(tmpdir(), 'no-such-check-og-dist'));
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });
});
