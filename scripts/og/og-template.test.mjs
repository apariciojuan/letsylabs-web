import { describe, expect, it } from 'vitest';
import { escapeXml, ogHtmlDocument, ogSvg } from './og-template.mjs';

describe('escapeXml', () => {
  it('escapes the 5 XML-unsafe characters', () => {
    expect(escapeXml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&apos;&amp;&apos;&lt;/a&gt;',
    );
  });

  it('leaves plain text untouched', () => {
    expect(escapeXml('Voice — letsylabs')).toBe('Voice — letsylabs');
  });
});

describe('ogSvg', () => {
  it('is a 1200x630 SVG document', () => {
    const svg = ogSvg({ title: 'Voice — letsylabs' });
    expect(svg).toContain('width="1200" height="630"');
    expect(svg).toContain('viewBox="0 0 1200 630"');
  });

  it('includes the pulse motif (3 signal-green nodes + connecting line)', () => {
    const svg = ogSvg({ title: 'Voice — letsylabs' });
    expect((svg.match(/fill="#4AF2A1"/g) ?? []).length).toBe(3);
    expect(svg).toContain('stroke="rgba(255,255,255,0.25)"');
  });

  it('includes the wordmark', () => {
    expect(ogSvg({ title: 'Voice — letsylabs' })).toContain('letsylabs</text>');
  });

  it('escapes the title text', () => {
    const svg = ogSvg({ title: 'A & B <script>' });
    expect(svg).toContain('A &amp; B &lt;script&gt;');
    expect(svg).not.toContain('<script>');
  });

  it('renders the title inside a foreignObject div (wraps unlike svg <text>)', () => {
    const svg = ogSvg({ title: 'Some long title' });
    expect(svg).toContain('<foreignObject');
    expect(svg).toContain('Some long title</div>');
  });
});

describe('ogHtmlDocument', () => {
  it('wraps the svg in an exact 1200x630 html document with the embedded font', () => {
    const svg = ogSvg({ title: 'x' });
    const doc = ogHtmlDocument(svg, 'ZmFrZS1mb250LWJ5dGVz');
    expect(doc).toContain('<!doctype html>');
    expect(doc).toContain('width: 1200px');
    expect(doc).toContain('height: 630px');
    expect(doc).toContain('data:font/ttf;base64,ZmFrZS1mb250LWJ5dGVz');
    expect(doc).toContain(svg);
  });
});
