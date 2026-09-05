import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS_PATH = path.resolve(__dirname, 'tokens.css');

/**
 * Extracts every `--custom-property: value;` declaration from the file's `:root { ... }` block.
 * Comments are stripped first so trailing/standalone `/* ... *\/` notes never leak into a value.
 * Exported so a future ratchet (or another test) can reuse the same parser instead of re-deriving
 * it against raw CSS text.
 */
export function parseRootCustomProperties(css: string): Record<string, string> {
  const rootMatch = css.match(/:root\s*{([^}]*)}/);
  if (!rootMatch) {
    throw new Error('tokens.css: no :root { ... } block found');
  }
  const body = rootMatch[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const props: Record<string, string> = {};
  const declaration = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = declaration.exec(body)) !== null) {
    props[match[1]] = match[2].trim();
  }
  return props;
}

describe('design tokens (:root custom properties in src/styles/tokens.css)', () => {
  const css = readFileSync(CSS_PATH, 'utf8');
  const tokens = parseRootCustomProperties(css);

  it('matches the committed snapshot -- any diff here must be a conscious, reviewed edit', () => {
    expect(tokens).toMatchSnapshot();
  });

  it('keeps the exact color table from design_handoff_letsylabs_web/README.md (§Design Tokens)', () => {
    expect(tokens['--bg']).toBe('#07090d');
    expect(tokens['--surface']).toBe('#0d1117');
    expect(tokens['--surface-2']).toBe('#131a23');
    expect(tokens['--ink']).toBe('#e8edf2');
    expect(tokens['--muted']).toBe('#8b96a5');
    expect(tokens['--signal']).toBe('#4af2a1');
    expect(tokens['--signal-hover']).toBe('#6ff5b5');
    expect(tokens['--link-hover']).toBe('#8df7c5');
    expect(tokens['--tel']).toBe('#ffb454');
    expect(tokens['--event']).toBe('#58c4f6');
    expect(tokens['--alert']).toBe('#ff6b6b');
    expect(tokens['--line']).toBe('rgba(255, 255, 255, 0.08)');
    expect(tokens['--line-strong']).toBe('rgba(255, 255, 255, 0.14)');
  });

  it('keeps the container/section spacing from README (§Espaciado y forma)', () => {
    expect(tokens['--container-max-width']).toBe('1180px');
    expect(tokens['--container-padding-inline']).toBe('32px');
    expect(tokens['--section-padding-block']).toBe('64px');
    expect(tokens['--section-padding-block-lg']).toBe('104px');
    expect(tokens['--header-height']).toBe('64px');
  });

  it('keeps the radii from README (buttons/inputs 8px, cards 12px, badges 4px, dashed 16px)', () => {
    expect(tokens['--radius-sm']).toBe('8px');
    expect(tokens['--radius-md']).toBe('12px');
    expect(tokens['--radius-badge']).toBe('4px');
    expect(tokens['--radius-lg']).toBe('16px');
  });

  it('keeps the dropdown/terminal shadows from README', () => {
    expect(tokens['--shadow-dropdown']).toBe('0 20px 60px rgba(0, 0, 0, 0.5)');
    expect(tokens['--shadow-terminal']).toBe('0 24px 80px rgba(0, 0, 0, 0.45)');
  });

  it('keeps the exact letter-spacing per level (regression: h2-section was wrongly -0.5px, the wordmark value, in W-1)', () => {
    expect(tokens['--tracking-wordmark']).toBe('-0.5px');
    expect(tokens['--tracking-h1-hero']).toBe('-1.5px');
    expect(tokens['--tracking-h2-section']).toBe('-0.8px');
    expect(tokens['--tracking-h2-minor']).toBe('-0.6px');
    expect(tokens['--tracking-eyebrow']).toBe('2px');
    expect(tokens['--tracking-label']).toBe('1.5px');
    expect(tokens['--tracking-badge']).toBe('1px');
  });

  it('keeps the hero radial-gradient opacities (signal 0.06, telephony amber 0.05)', () => {
    expect(tokens['--radial-signal-opacity']).toBe('0.06');
    expect(tokens['--radial-tel-opacity']).toBe('0.05');
  });
});

describe('h2 base rule (regression: letter-spacing must reference the section token, not -0.5px)', () => {
  it('the global h2 selector uses var(--tracking-h2-section), not a hard-coded -0.5px', () => {
    const css = readFileSync(CSS_PATH, 'utf8');
    const h2Rule = css.match(/(?:^|\n)h2\s*{([^}]*)}/);
    expect(h2Rule).not.toBeNull();
    const declarationsOnly = (h2Rule?.[1] ?? '').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declarationsOnly).toMatch(/letter-spacing:\s*var\(--tracking-h2-section\)/);
    expect(declarationsOnly).not.toMatch(/-0\.5px/);
  });
});
