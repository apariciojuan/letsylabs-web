// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createDisclosure, getFocusableElements, initMegaMenus, initMobileDrawer, trapFocus } from './nav';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('createDisclosure', () => {
  function setup() {
    const trigger = document.createElement('button');
    const panel = document.createElement('div');
    document.body.append(trigger, panel);
    return { trigger, panel };
  }

  it('starts closed (aria-expanded=false, no is-open class)', () => {
    const { trigger, panel } = setup();
    createDisclosure(trigger, panel);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.classList.contains('is-open')).toBe(false);
  });

  it('clicking the trigger toggles it open, then closed', () => {
    const { trigger, panel } = setup();
    createDisclosure(trigger, panel);

    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.classList.contains('is-open')).toBe(true);

    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.classList.contains('is-open')).toBe(false);
  });

  it('Escape closes it and returns focus to the trigger', () => {
    const { trigger, panel } = setup();
    const disclosure = createDisclosure(trigger, panel);
    disclosure.setOpen(true);
    panel.appendChild(document.createElement('a')).setAttribute('href', '#');
    panel.querySelector('a')?.focus();

    panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(disclosure.isOpen()).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it('a click outside closes it when closeOnOutsideClick is set', () => {
    const { trigger, panel } = setup();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const disclosure = createDisclosure(trigger, panel, { closeOnOutsideClick: true });
    disclosure.setOpen(true);

    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(disclosure.isOpen()).toBe(false);
  });

  it('a click inside the panel does not close it', () => {
    const { trigger, panel } = setup();
    const disclosure = createDisclosure(trigger, panel, { closeOnOutsideClick: true });
    disclosure.setOpen(true);

    panel.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(disclosure.isOpen()).toBe(true);
  });

  it('destroy() removes all listeners (a later click is a no-op)', () => {
    const { trigger, panel } = setup();
    const disclosure = createDisclosure(trigger, panel);
    disclosure.destroy();

    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  describe('hoverContainer (hover/focus open independently of the click-driven "pinned" state)', () => {
    function setupWithHover() {
      const container = document.createElement('div');
      const trigger = document.createElement('button');
      const panel = document.createElement('div');
      container.append(trigger, panel);
      document.body.appendChild(container);
      return { container, trigger, panel };
    }

    it('regression: a click still opens it even though clicking always fires mouseenter first (bug found in e2e/site-nav.spec.ts)', () => {
      const { container, trigger, panel } = setupWithHover();
      createDisclosure(trigger, panel, { hoverContainer: container });

      // Simulates exactly what a real click does: the mouse enters the trigger's bounds (firing a
      // genuine `mouseenter`) before the `click` event itself fires.
      container.dispatchEvent(new MouseEvent('mouseenter'));
      trigger.click();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(panel.classList.contains('is-open')).toBe(true);
    });

    it('regression: after that, moving the mouse away while still "pinned" open keeps it open; a second click (which re-hovers, then un-pins) needs the mouse to ALSO leave before it fully closes', () => {
      const { container, trigger, panel } = setupWithHover();
      createDisclosure(trigger, panel, { hoverContainer: container });

      container.dispatchEvent(new MouseEvent('mouseenter'));
      trigger.click(); // opens (pinned)
      container.dispatchEvent(new MouseEvent('mouseleave'));
      expect(trigger.getAttribute('aria-expanded')).toBe('true'); // still open: pinned

      container.dispatchEvent(new MouseEvent('mouseenter')); // 2nd click's mouse movement
      trigger.click(); // un-pins, but hover still holds it open
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      container.dispatchEvent(new MouseEvent('mouseleave')); // mouse finally leaves
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('mouseenter on the container opens it; mouseleave closes it', () => {
      const { container, trigger } = setupWithHover();
      createDisclosure(trigger, container.querySelector('div')!, { hoverContainer: container });

      container.dispatchEvent(new MouseEvent('mouseenter'));
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      container.dispatchEvent(new MouseEvent('mouseleave'));
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('focusin on the container opens it; focusout to OUTSIDE the container closes it', () => {
      const { container, trigger, panel } = setupWithHover();
      createDisclosure(trigger, panel, { hoverContainer: container });

      container.dispatchEvent(new FocusEvent('focusin'));
      expect(trigger.getAttribute('aria-expanded')).toBe('true');

      const outside = document.createElement('div');
      document.body.appendChild(outside);
      container.dispatchEvent(new FocusEvent('focusout', { relatedTarget: outside }));
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
    });

    it('focusout to another element still INSIDE the container does not close it', () => {
      const { container, trigger, panel } = setupWithHover();
      createDisclosure(trigger, panel, { hoverContainer: container });
      container.dispatchEvent(new FocusEvent('focusin'));

      const linkInsidePanel = document.createElement('a');
      panel.appendChild(linkInsidePanel);
      container.dispatchEvent(new FocusEvent('focusout', { relatedTarget: linkInsidePanel }));

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
    });
  });
});

describe('getFocusableElements / trapFocus', () => {
  function drawerWithLinks() {
    const container = document.createElement('div');
    container.innerHTML = '<a href="/a">A</a><a href="/b">B</a><button>C</button>';
    document.body.appendChild(container);
    return container;
  }

  it('lists focusable descendants in DOM order', () => {
    const container = drawerWithLinks();
    const focusable = getFocusableElements(container);
    expect(focusable.map((el) => el.textContent)).toEqual(['A', 'B', 'C']);
  });

  it('Tab on the last element wraps to the first', () => {
    const container = drawerWithLinks();
    const [first, , last] = getFocusableElements(container);
    last.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    trapFocus(container, event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
  });

  it('Shift+Tab on the first element wraps to the last', () => {
    const container = drawerWithLinks();
    const [first, , last] = getFocusableElements(container);
    first.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true });
    trapFocus(container, event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it('ignores non-Tab keys and does nothing with zero focusable elements', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    expect(() => trapFocus(container, event)).not.toThrow();
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('initMegaMenus', () => {
  it('wires a trigger/panel pair matched by aria-controls', () => {
    document.body.innerHTML = `
      <div>
        <button data-mega-menu-trigger aria-controls="mega-1">Product</button>
        <div id="mega-1" data-mega-menu-panel></div>
      </div>
    `;
    const stop = initMegaMenus(document);
    const trigger = document.querySelector<HTMLElement>('[data-mega-menu-trigger]')!;
    trigger.click();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    stop();
  });

  it('does nothing (no throw) when aria-controls points at a missing panel', () => {
    document.body.innerHTML = `<button data-mega-menu-trigger aria-controls="missing">Product</button>`;
    expect(() => initMegaMenus(document)).not.toThrow();
  });

  it('syncs aria-expanded to hover on the [data-mega-menu-container] ancestor (regression: ARIA/visual mismatch with the CSS :hover reveal)', () => {
    document.body.innerHTML = `
      <div data-mega-menu-container>
        <button data-mega-menu-trigger aria-controls="mega-1">Product</button>
        <div id="mega-1" data-mega-menu-panel></div>
      </div>
    `;
    const stop = initMegaMenus(document);
    const container = document.querySelector<HTMLElement>('[data-mega-menu-container]')!;
    const trigger = document.querySelector<HTMLElement>('[data-mega-menu-trigger]')!;

    container.dispatchEvent(new MouseEvent('mouseenter'));
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    container.dispatchEvent(new MouseEvent('mouseleave'));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    stop();
  });
});

describe('initMobileDrawer', () => {
  it('opens on click and traps Tab within the panel', () => {
    document.body.innerHTML = `
      <button data-drawer-toggle aria-controls="drawer">Menu</button>
      <nav id="drawer" data-drawer-panel>
        <a href="/voice">Voice</a>
        <a href="/pricing">Pricing</a>
      </nav>
    `;
    const stop = initMobileDrawer(document);
    const toggle = document.querySelector<HTMLElement>('[data-drawer-toggle]')!;
    const panel = document.querySelector<HTMLElement>('[data-drawer-panel]')!;

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    const links = panel.querySelectorAll('a');
    (links[links.length - 1] as HTMLElement).focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true, bubbles: true });
    panel.dispatchEvent(event);
    expect(document.activeElement).toBe(links[0]);

    stop();
  });

  it('is a no-op when the toggle/panel markup is absent', () => {
    document.body.innerHTML = '<div>no drawer here</div>';
    expect(() => initMobileDrawer(document)).not.toThrow();
  });
});
