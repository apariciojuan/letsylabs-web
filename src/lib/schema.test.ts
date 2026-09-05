import { describe, expect, it } from 'vitest';
import { softwareApplicationSchema } from './schema';

const ORIGIN = 'https://letsylabs.com';

describe('softwareApplicationSchema', () => {
  it('builds a valid SoftwareApplication node for English, no `offers` (honesty rule -- no price yet)', () => {
    const schema = softwareApplicationSchema('en', ORIGIN);
    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@type']).toBe('SoftwareApplication');
    expect(schema.name).toBe('letsylabs');
    expect(schema.applicationCategory).toBe('DeveloperApplication');
    expect(schema.operatingSystem).toBe('Linux');
    expect(schema.url).toBe('https://letsylabs.com/');
    expect(schema.inLanguage).toBe('en');
    expect(schema.description.length).toBeGreaterThan(0);
    expect(schema).not.toHaveProperty('offers');
  });

  it('points url at /es/ and inLanguage at es for the Spanish version', () => {
    const schema = softwareApplicationSchema('es', ORIGIN);
    expect(schema.url).toBe('https://letsylabs.com/es/');
    expect(schema.inLanguage).toBe('es');
  });

  it('the whole object round-trips through JSON.stringify/parse (what BaseLayout actually emits)', () => {
    const schema = softwareApplicationSchema('en', ORIGIN);
    expect(JSON.parse(JSON.stringify(schema))).toEqual(schema);
  });
});
