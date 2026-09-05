// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { initCodeTabs, nextTabId } from './code-tabs';

describe('nextTabId', () => {
  const ids = ['curl', 'rust', 'py'];

  it('moves forward and wraps past the end', () => {
    expect(nextTabId(ids, 'curl', 1)).toBe('rust');
    expect(nextTabId(ids, 'rust', 1)).toBe('py');
    expect(nextTabId(ids, 'py', 1)).toBe('curl');
  });

  it('moves backward and wraps past the start', () => {
    expect(nextTabId(ids, 'curl', -1)).toBe('py');
    expect(nextTabId(ids, 'py', -1)).toBe('rust');
  });

  it('falls back to index 0 for an unknown current id', () => {
    expect(nextTabId(ids, 'nope', 1)).toBe('rust');
  });
});

function fixture() {
  document.body.innerHTML = `
    <div data-tabs>
      <div role="tablist">
        <button role="tab" data-tab-id="curl" aria-selected="true" id="tab-curl">curl</button>
        <button role="tab" data-tab-id="rust" aria-selected="false" id="tab-rust">Rust</button>
        <button role="tab" data-tab-id="py" aria-selected="false" id="tab-py">Python</button>
      </div>
      <div>
        <pre data-tab-panel="curl">curl snippet</pre>
        <pre data-tab-panel="rust">rust snippet</pre>
        <pre data-tab-panel="py">py snippet</pre>
      </div>
    </div>
  `;
  return {
    tab: (id: string) => document.getElementById(`tab-${id}`)!,
    panel: (id: string) => document.querySelector<HTMLElement>(`[data-tab-panel="${id}"]`)!,
  };
}

describe('initCodeTabs', () => {
  it('on init, hides every panel except the initially-selected tab (collapsing the no-JS stack)', () => {
    const { panel } = fixture();
    initCodeTabs(document);
    expect(panel('curl').hidden).toBe(false);
    expect(panel('rust').hidden).toBe(true);
    expect(panel('py').hidden).toBe(true);
  });

  it('clicking a tab activates it: aria-selected flips and its panel becomes visible', () => {
    const { tab, panel } = fixture();
    initCodeTabs(document);

    tab('rust').click();

    expect(tab('rust').getAttribute('aria-selected')).toBe('true');
    expect(tab('curl').getAttribute('aria-selected')).toBe('false');
    expect(panel('rust').hidden).toBe(false);
    expect(panel('curl').hidden).toBe(true);
  });

  it('ArrowRight on the focused tab moves to and focuses the next tab', () => {
    const { tab } = fixture();
    initCodeTabs(document);

    tab('curl').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));

    expect(tab('rust').getAttribute('aria-selected')).toBe('true');
    expect(document.activeElement).toBe(tab('rust'));
  });

  it('ArrowLeft wraps from the first tab to the last', () => {
    const { tab } = fixture();
    initCodeTabs(document);

    tab('curl').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));

    expect(tab('py').getAttribute('aria-selected')).toBe('true');
  });

  it('destroy() removes the click/keydown listeners', () => {
    const { tab } = fixture();
    const destroy = initCodeTabs(document);
    destroy();

    tab('rust').click();
    expect(tab('rust').getAttribute('aria-selected')).toBe('false');
  });

  it('is a no-op when there are no [data-tabs] containers', () => {
    document.body.innerHTML = '<p>nothing here</p>';
    expect(() => initCodeTabs(document)).not.toThrow();
  });
});
