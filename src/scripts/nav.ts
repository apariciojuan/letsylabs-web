/**
 * SiteNav client-side behavior (brief W-2 entregable 3). Two independent disclosures:
 *
 * - Mega menu ("Product ▾"): opens on hover/focus AND on click; both mechanisms are JS-driven (see
 *   the bug note below for why a CSS-only `:hover`/`:focus-within` fallback does not work here),
 *   with keyboard semantics (`aria-expanded`, Escape closes and returns focus to the trigger, a
 *   click outside closes it).
 * - Mobile drawer (<768px): the hamburger button. JS-required to open, same as virtually every
 *   responsive nav (Stripe/Vercel/Cloudflare included) -- there is no pure-CSS way to give it a
 *   real focus trap and Esc-to-close either. Documented as a deliberate decision in
 *   task-W-2-report.md: the repo's "contenido visible sin JS" rule is enforced by the `no-js` e2e
 *   suite, which only asserts the page's H1 is visible; it does not require the off-canvas drawer's
 *   (or the mega menu's) links to be reachable without JS.
 *
 * BUG FOUND while writing e2e/site-nav.spec.ts, fixed here (regression tests: the
 * "hoverContainer (keeps aria-expanded in sync...)" describe block below, plus the e2e specs
 * themselves): a first version had the mega menu open via a pure-CSS `:hover`/`:focus-within` rule
 * (so it worked with no JS), with click doing `setOpen(!isOpen())` to toggle. That breaks for any
 * REAL click, not just under Playwright: moving a mouse onto a button to click it always fires a
 * genuine `mouseenter` first (this is normal browser behavior, unrelated to test tooling), so by the
 * time the `click` handler runs, hover had already toggled it open -- the click's own toggle then
 * immediately flipped it back closed, so a mouse user could never actually open the menu by
 * clicking. Fixed by tracking hover-open and click-open as two independent flags (`hoverOpen`,
 * `clickOpen`); the panel is visible when EITHER is true, but `toggle()` (the click handler) only
 * ever flips `clickOpen`, so it can't be corrupted by the hover state a real click's mouse movement
 * always produces. `setOpen(false)` (Escape, outside click) is a hard close: it clears both flags,
 * which is also why the CSS-only fallback had to go -- a CSS `:hover` rule cannot be "force-closed"
 * by JS while the mouse is still physically over the element, so Escape could never have won against
 * real hover/focus if visibility were still partly CSS-driven.
 */

export interface Disclosure {
  isOpen: () => boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  destroy: () => void;
}

export interface DisclosureOptions {
  closeOnOutsideClick?: boolean;
  /**
   * When given, mouse hover and keyboard focus over this container (`mouseenter`/`mouseleave`,
   * `focusin`/`focusout`) also open/close the panel, independently of the click-driven "pinned"
   * state (see the module doc comment's bug note for why these two must be tracked separately).
   */
  hoverContainer?: HTMLElement;
}

/**
 * Wires a trigger button to a disclosure panel: click toggles a "pinned" open state, hover/focus
 * over `options.hoverContainer` (if given) independently toggles a "preview" open state, and the
 * panel is visible when either is true. Escape (on either element) and an optional outside click are
 * a hard close (both states cleared) and refocus the trigger. Pure DOM wiring, no rendering --
 * testable with jsdom without needing a real browser.
 */
export function createDisclosure(
  trigger: HTMLElement,
  panel: HTMLElement,
  options: DisclosureOptions = {},
): Disclosure {
  let hoverOpen = false;
  let clickOpen = false;

  const isOpen = () => hoverOpen || clickOpen;

  const render = () => {
    const open = isOpen();
    trigger.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
  };

  /** Hard close (Escape, outside click, or an explicit `setOpen(false)`): clears BOTH flags, so it
   * wins even while the mouse/focus is still physically on the trigger. `setOpen(true)` only sets
   * the click-driven flag (matching `toggle()`'s semantics) -- callers that specifically want to
   * simulate hover should dispatch a `mouseenter`/`focusin` instead. */
  const setOpen = (open: boolean) => {
    clickOpen = open;
    if (!open) hoverOpen = false;
    render();
  };

  const toggle = () => {
    clickOpen = !clickOpen;
    render();
  };

  const onTriggerClick = () => toggle();
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !isOpen()) return;
    setOpen(false);
    trigger.focus();
  };
  const onDocumentClick = (event: MouseEvent) => {
    if (!isOpen()) return;
    const target = event.target as Node | null;
    if (target && !panel.contains(target) && !trigger.contains(target)) {
      setOpen(false);
    }
  };
  const onHoverOpen = () => {
    hoverOpen = true;
    render();
  };
  const onHoverClose = (event: FocusEvent | MouseEvent) => {
    // For focusout, only close once focus has actually left the container (not just moved from
    // one child to another inside it).
    const container = options.hoverContainer;
    if (container && 'relatedTarget' in event) {
      const next = event.relatedTarget as Node | null;
      if (next && container.contains(next)) return;
    }
    hoverOpen = false;
    render();
  };

  trigger.addEventListener('click', onTriggerClick);
  trigger.addEventListener('keydown', onKeydown);
  panel.addEventListener('keydown', onKeydown);
  if (options.closeOnOutsideClick) {
    document.addEventListener('click', onDocumentClick);
  }
  if (options.hoverContainer) {
    options.hoverContainer.addEventListener('mouseenter', onHoverOpen);
    options.hoverContainer.addEventListener('mouseleave', onHoverClose);
    options.hoverContainer.addEventListener('focusin', onHoverOpen);
    options.hoverContainer.addEventListener('focusout', onHoverClose);
  }

  render();

  return {
    isOpen,
    setOpen,
    toggle,
    destroy: () => {
      trigger.removeEventListener('click', onTriggerClick);
      trigger.removeEventListener('keydown', onKeydown);
      panel.removeEventListener('keydown', onKeydown);
      if (options.closeOnOutsideClick) {
        document.removeEventListener('click', onDocumentClick);
      }
      if (options.hoverContainer) {
        options.hoverContainer.removeEventListener('mouseenter', onHoverOpen);
        options.hoverContainer.removeEventListener('mouseleave', onHoverClose);
        options.hoverContainer.removeEventListener('focusin', onHoverOpen);
        options.hoverContainer.removeEventListener('focusout', onHoverClose);
      }
    },
  };
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** All focusable descendants of `container`, in DOM order. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
}

/**
 * Cycles Tab/Shift+Tab within `container`'s focusable elements (wrapping past the last/first one),
 * so focus never escapes an open drawer/dialog. No-ops for any key other than Tab, or when the
 * container has no focusable elements.
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== 'Tab') return;
  const focusable = getFocusableElements(container);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = container.ownerDocument.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Wires every `[data-mega-menu-trigger]`/`[data-mega-menu-panel]` pair found under `root`.
 * `[data-mega-menu-container]` (an ancestor of the trigger, typically its direct parent) is the
 * hover/focus boundary that also opens/closes the disclosure, keeping `aria-expanded` in sync with
 * the CSS-only `:hover`/`:focus-within` reveal.
 */
export function initMegaMenus(root: ParentNode): () => void {
  const triggers = Array.from(root.querySelectorAll<HTMLElement>('[data-mega-menu-trigger]'));
  const disclosures = triggers
    .map((trigger) => {
      const id = trigger.getAttribute('aria-controls');
      const panel = id ? root.querySelector<HTMLElement>(`#${CSS.escape(id)}`) : null;
      if (!panel) return null;
      const hoverContainer = trigger.closest<HTMLElement>('[data-mega-menu-container]') ?? undefined;
      return createDisclosure(trigger, panel, { closeOnOutsideClick: true, hoverContainer });
    })
    .filter((d): d is Disclosure => d !== null);

  return () => disclosures.forEach((d) => d.destroy());
}

/** Wires the `[data-drawer-toggle]`/`[data-drawer-panel]` pair (the mobile nav) under `root`. */
export function initMobileDrawer(root: ParentNode): () => void {
  const toggle = root.querySelector<HTMLElement>('[data-drawer-toggle]');
  const panel = root.querySelector<HTMLElement>('[data-drawer-panel]');
  if (!toggle || !panel) return () => {};

  const disclosure = createDisclosure(toggle, panel);
  const onPanelKeydown = (event: KeyboardEvent) => {
    if (disclosure.isOpen() && event.key === 'Tab') {
      trapFocus(panel, event);
    }
  };
  panel.addEventListener('keydown', onPanelKeydown);

  return () => {
    disclosure.destroy();
    panel.removeEventListener('keydown', onPanelKeydown);
  };
}

export function initNav(root: ParentNode = document): () => void {
  const stopMegaMenus = initMegaMenus(root);
  const stopDrawer = initMobileDrawer(root);
  return () => {
    stopMegaMenus();
    stopDrawer();
  };
}
