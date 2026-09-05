import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkThirdPartySh = path.join(scriptsDir, 'check_third_party.sh');

function run(fixtureDirRelativePath, env = {}) {
  const fixtureDir = path.join(scriptsDir, fixtureDirRelativePath);
  return spawnSync('sh', [checkThirdPartySh, fixtureDir], {
    encoding: 'utf8',
    env: { ...process.env, PUBLIC_WAITLIST_ENDPOINT: '', ...env },
  });
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

  // Brief W-7 / D-W7-6: the ONE explicit exception -- a <form action> pointing at the exact
  // configured PUBLIC_WAITLIST_ENDPOINT (Formspree in production).
  describe('the PUBLIC_WAITLIST_ENDPOINT <form action> exception (D-W7-6)', () => {
    const ALLOWED = 'https://formspree.io/f/mockid123';

    it('passes (exit 0) when the <form action> matches PUBLIC_WAITLIST_ENDPOINT exactly', () => {
      const result = run('fixtures/dist_with_allowed_action', {
        PUBLIC_WAITLIST_ENDPOINT: ALLOWED,
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('OK');
    });

    it('fails (exit 1) on that SAME action when no endpoint env var is set (no exception granted)', () => {
      const result = run('fixtures/dist_with_allowed_action');
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('formspree.io');
    });

    it('fails (exit 1) on a DIFFERENT external <form action>, even with the endpoint env var set', () => {
      const result = run('fixtures/dist_with_other_action', { PUBLIC_WAITLIST_ENDPOINT: ALLOWED });
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('not-the-configured-endpoint.example.com');
    });
  });
});
