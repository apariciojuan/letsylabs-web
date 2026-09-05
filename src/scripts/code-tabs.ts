/**
 * Developers section code tabs (brief W-3, W3-3a / "letsylabs Homepage.dc.html" lines 361-392):
 * an accessible tablist (`role="tablist"/"tab"/"tabpanel"`, `aria-selected`, arrow-key navigation)
 * over the curl/Rust/Python snippets.
 *
 * Decision (docs/plans/web/03_homepage.md): without JavaScript the three `<pre>` panels render
 * stacked (all visible, no `hidden` on any of them) rather than only the first one -- so a crawler
 * or a no-JS visitor sees every snippet, not just "curl". `initCodeTabs` is what turns that into
 * real single-panel tab behavior: on init it hides every panel except the initially-active one, then
 * wires clicks and arrow keys to switch which one is visible.
 */
export function nextTabId(ids: readonly string[], current: string, direction: 1 | -1): string {
  if (ids.length === 0) return current;
  const index = ids.indexOf(current);
  const base = index === -1 ? 0 : index;
  const nextIndex = (base + direction + ids.length) % ids.length;
  return ids[nextIndex];
}

interface WiredTabs {
  tabs: HTMLElement[];
  panels: Map<string, HTMLElement>;
  ids: string[];
}

function wire(container: Element): WiredTabs | null {
  const tabs = Array.from(container.querySelectorAll<HTMLElement>('[role="tab"][data-tab-id]'));
  if (tabs.length === 0) return null;
  const panels = new Map<string, HTMLElement>();
  container.querySelectorAll<HTMLElement>('[data-tab-panel]').forEach((panel) => {
    const id = panel.dataset.tabPanel;
    if (id) panels.set(id, panel);
  });
  const ids = tabs.map((tab) => tab.dataset.tabId!);
  return { tabs, panels, ids };
}

/** Wires every `[data-tabs]` container found under `root`. Returns a teardown function. */
export function initCodeTabs(root: ParentNode = document): () => void {
  const containers = Array.from(root.querySelectorAll<HTMLElement>('[data-tabs]'));
  const cleanups: Array<() => void> = [];

  for (const container of containers) {
    const wired = wire(container);
    if (!wired) continue;
    const { tabs, panels, ids } = wired;

    const activate = (id: string, options: { focus?: boolean } = {}) => {
      for (const tab of tabs) {
        const isActive = tab.dataset.tabId === id;
        tab.setAttribute('aria-selected', String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
        tab.classList.toggle('is-active', isActive);
        if (isActive && options.focus) tab.focus();
      }
      for (const [panelId, panel] of panels) {
        panel.hidden = panelId !== id;
      }
    };

    // On init: collapse the no-JS "all panels stacked" state down to a single active panel/tab.
    const initiallyActive = tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
    activate(initiallyActive?.dataset.tabId ?? ids[0]);

    const onClick = (event: MouseEvent) => {
      const tab = (event.currentTarget as HTMLElement).dataset.tabId;
      if (tab) activate(tab);
    };
    const onKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const current = (event.currentTarget as HTMLElement).dataset.tabId ?? ids[0];
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      activate(nextTabId(ids, current, direction), { focus: true });
    };

    const listeners = tabs.map((tab) => {
      tab.addEventListener('click', onClick);
      tab.addEventListener('keydown', onKeydown);
      return { tab, onClick, onKeydown };
    });

    cleanups.push(() => {
      listeners.forEach(({ tab, onClick: click, onKeydown: keydown }) => {
        tab.removeEventListener('click', click);
        tab.removeEventListener('keydown', keydown);
      });
    });
  }

  return () => cleanups.forEach((cleanup) => cleanup());
}
