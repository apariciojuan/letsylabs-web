import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkThirdPartySh = path.join(scriptsDir, 'check_third_party.sh');

function run(fixtureDirRelativePath) {
  const fixtureDir = path.join(scriptsDir, fixtureDirRelativePath);
  return spawnSync('sh', [checkThirdPartySh, fixtureDir], { encoding: 'utf8' });
}

describe('check_third_party.sh (zero third-party resources ratchet)', () => {
  it('fails (exit 1) when a third-party <script src="https://..."> tag is present', () => {
    const result = run('fixtures/dist_bad');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('googletagmanager.com');
  });

  // Regression for adversarial review W-1 H2: protocol-relative scripts, external <link> and
  // <iframe>/<img> used to pass unnoticed.
  it('fails (exit 1) on protocol-relative scripts, external <link>, <iframe> and <img>', () => {
    const result = run('fixtures/dist_bad_widened');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('cdn.jsdelivr.net');
    expect(result.stderr).toContain('fonts.googleapis.com');
    expect(result.stderr).toContain('youtube.com');
    expect(result.stderr).toContain('images.example.com');
  });

  it('passes (exit 0) for local resources plus absolute alternate/canonical links', () => {
    const result = run('fixtures/dist_ok_alternate');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('passes (exit 0) for local/inline scripts only', () => {
    const result = run('fixtures/dist_ok');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('passes (exit 0) when dist/ does not exist yet', () => {
    const result = run('fixtures/no_such_dist_dir');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });
});
