import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const checkNoDevPagesSh = path.join(scriptsDir, 'check_no_dev_pages.sh');

function run(fixtureDirRelativePath) {
  const fixtureDir = path.join(scriptsDir, fixtureDirRelativePath);
  return spawnSync('sh', [checkNoDevPagesSh, fixtureDir], { encoding: 'utf8' });
}

describe('check_no_dev_pages.sh (dev-only QA harness must not ship in the production build)', () => {
  it('passes (exit 0) when dist/ has no dev/ directory', () => {
    const result = run('fixtures/dist_no_dev');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('OK');
  });

  it('fails (exit 1) when dist/dev/ is present (the strip-dev-pages build hook did not run/failed)', () => {
    const result = run('fixtures/dist_with_dev');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('dist_with_dev/dev');
  });

  it('passes (exit 0) when dist/ does not exist yet (nothing built)', () => {
    const result = run('fixtures/no_such_dist_dir');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('does not exist yet');
  });
});
