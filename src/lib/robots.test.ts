import { describe, expect, it } from 'vitest';
import { buildRobotsTxt } from './robots';

describe('buildRobotsTxt', () => {
  it('allows everything and points at an absolute sitemap URL', () => {
    const body = buildRobotsTxt('https://letsylabs.com');
    expect(body).toContain('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Sitemap: https://letsylabs.com/sitemap.xml');
  });

  it('never emits a Disallow directive', () => {
    expect(buildRobotsTxt('https://letsylabs.com')).not.toContain('Disallow');
  });
});
