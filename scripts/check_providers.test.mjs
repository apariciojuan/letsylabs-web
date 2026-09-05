import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_EVERYWHERE,
  ALLOWED_ROUTES_BY_TERM,
  findForbiddenHits,
  findOutOfRouteHits,
} from './check_providers.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkProvidersMjs = path.join(scriptsDir, 'check_providers.mjs');

function run(fixtureName) {
  const distDir = path.join(scriptsDir, 'fixtures', fixtureName, 'dist');
  return spawnSync('node', [checkProvidersMjs, distDir], { encoding: 'utf8' });
}

describe('findForbiddenHits (logic unit)', () => {
  it('flags Deepgram/ElevenLabs/LiveKit regardless of case', () => {
    expect(findForbiddenHits('<p>deepgram powers our STT.</p>')).toEqual(['Deepgram']);
    expect(findForbiddenHits('<p>ELEVENLABS and LiveKit.</p>')).toEqual(['ElevenLabs', 'LiveKit']);
  });

  it('returns [] when none of the forbidden names appear', () => {
    expect(findForbiddenHits('<p>Bring your own intelligence.</p>')).toEqual([]);
  });
});

describe('findOutOfRouteHits (logic unit, CU-W9-3)', () => {
  it('allows Asterisk/3CX/SIP on /telephony', () => {
    expect(findOutOfRouteHits('<p>Asterisk, 3CX, or your SIP carrier.</p>', '/telephony')).toEqual(
      [],
    );
  });

  it('allows Asterisk/3CX/SIP on Home ("/")', () => {
    expect(findOutOfRouteHits('<p>Asterisk, 3CX, your carrier.</p>', '/')).toEqual([]);
  });

  it('flags Asterisk on /voice (not in its allowlist) -- CU-W9-3', () => {
    expect(findOutOfRouteHits('<p>Bring your Asterisk trunk here.</p>', '/voice')).toEqual([
      'Asterisk',
    ]);
  });

  it('allows Voxtral on /open-source but flags it on /self-host', () => {
    expect(findOutOfRouteHits('<p>Voxtral and friends.</p>', '/open-source')).toEqual([]);
    expect(findOutOfRouteHits('<p>Voxtral and friends.</p>', '/self-host')).toEqual(['Voxtral']);
  });

  it('fails closed (flags) on an unrecognized route (null)', () => {
    expect(findOutOfRouteHits('<p>Asterisk.</p>', null)).toEqual(['Asterisk']);
  });

  it('every ALLOWED_ROUTES_BY_TERM entry lists at least one route', () => {
    for (const routes of Object.values(ALLOWED_ROUTES_BY_TERM)) {
      expect(routes.length).toBeGreaterThan(0);
    }
  });
});

describe('check_providers.mjs (CLI, dist/**/*.html ratchet)', () => {
  it('passes (exit 0) when every provider name stays on its allowed route(s)', () => {
    const result = run('providers_ok');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails (exit 1) on Deepgram/ElevenLabs/LiveKit anywhere', () => {
    const result = run('providers_forbidden');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('forbidden provider name "Deepgram"');
    expect(result.stderr).toContain('forbidden provider name "ElevenLabs"');
    expect(result.stderr).toContain('forbidden provider name "LiveKit"');
  });

  it('fails (exit 1) when Asterisk appears outside its allowed routes', () => {
    const result = run('providers_out_of_route');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('"Asterisk" found on route /voice');
  });

  it('passes (exit 0) when the dist dir does not exist yet (nothing built)', () => {
    const result = run('no_such_dist_dir');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });

  it('FORBIDDEN_EVERYWHERE never overlaps ALLOWED_ROUTES_BY_TERM', () => {
    for (const term of FORBIDDEN_EVERYWHERE) {
      expect(Object.keys(ALLOWED_ROUTES_BY_TERM)).not.toContain(term);
    }
  });
});
