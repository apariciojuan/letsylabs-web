import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkComposeSh = path.join(scriptsDir, 'check_compose.sh');

function run(fixtureRelativePath) {
  const fixturePath = path.join(scriptsDir, fixtureRelativePath);
  return spawnSync('sh', [checkComposeSh, fixturePath], { encoding: 'utf8' });
}

describe('check_compose.sh (CU-CONT-9 ratchet)', () => {
  it('fails (exit 1) when a service is missing mem_limit/memswap_limit/healthcheck', () => {
    const result = run('fixtures/compose_bad.json');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("service 'web' has no mem_limit");
    expect(result.stderr).toContain("service 'web' has no healthcheck");
  });

  it('passes (exit 0) when every service declares all three', () => {
    const result = run('fixtures/compose_ok.json');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails with a clear message when the input file does not exist', () => {
    const result = run('fixtures/does_not_exist.json');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('not found');
  });
});
