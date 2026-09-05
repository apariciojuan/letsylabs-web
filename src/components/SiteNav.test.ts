import { getAllByRole, getByRole, within } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import SiteNav from './SiteNav.astro';

async function renderNav(locale: 'en' | 'es', path = '/'): Promise<HTMLElement> {
  return renderToBody(SiteNav, {
    props: { locale },
    request: new Request(`http://example.com${path}`),
  });
}

/**
 * The full nav markup includes both the desktop links (`.site-nav-links`, shown >=768px) and the
 * mobile drawer (`#site-nav-drawer`, shown <768px) at all times -- CSS, not conditional rendering,
 * decides which is visible at a given width. Queries below are scoped to the desktop nav so a link
 * that also appears in the drawer (Voice, Pricing, Developers...) isn't ambiguous.
 */
function desktopNav(body: HTMLElement): HTMLElement {
  const nav = body.querySelector<HTMLElement>('.site-nav-links');
  if (!nav) throw new Error('".site-nav-links" not found');
  return nav;
}

describe('SiteNav', () => {
  it('renders the top-level links with locale-aware hrefs (en: bare paths)', async () => {
    const body = await renderNav('en');
    const nav = within(desktopNav(body));
    expect(nav.getByRole('link', { name: 'Developers' }).getAttribute('href')).toBe('/open-source');
    expect(nav.getByRole('link', { name: 'Pricing' }).getAttribute('href')).toBe('/pricing');
    expect(nav.getByRole('link', { name: 'Company' }).getAttribute('href')).toBe('/company');
  });

  it('prefixes every link with /es for the Spanish locale (labels are TODO-ES until translated)', async () => {
    const body = await renderNav('es');
    const nav = desktopNav(body);
    expect(nav.querySelector('a[href="/es/open-source"]')?.textContent).toBe('TODO-ES: Developers');
    expect(nav.querySelector('a[href="/es/pricing"]')?.textContent).toBe('TODO-ES: Pricing');
  });

  it('marks the current top-level section active via aria-current="page"', async () => {
    const onPricing = await renderNav('en', '/pricing');
    const nav = within(desktopNav(onPricing));
    expect(nav.getByRole('link', { name: 'Pricing' }).getAttribute('aria-current')).toBe('page');
    expect(nav.getByRole('link', { name: 'Developers' }).getAttribute('aria-current')).toBeNull();
  });

  it('marks the Product trigger active when on a Product page (e.g. /voice)', async () => {
    const onVoice = await renderNav('en', '/voice');
    const trigger = getByRole(onVoice, 'button', { name: /product/i });
    expect(trigger.className).toContain('is-active');
  });

  it('renders the Product mega menu with 4 AVAILABLE items and 3 PLATFORM VISION items badged COMING SOON', async () => {
    const body = await renderNav('en');
    const panel = body.querySelector<HTMLElement>('#mega-menu-product');
    expect(panel).not.toBeNull();
    const availableLinks = getAllByRole(panel!, 'link');
    expect(availableLinks.map((el) => el.textContent)).toEqual([
      expect.stringContaining('Voice'),
      expect.stringContaining('Telephony'),
      expect.stringContaining('Compliance'),
      expect.stringContaining('Self-host'),
    ]);
    const badges = panel!.querySelectorAll('.badge');
    expect(badges).toHaveLength(3);
    badges.forEach((badge) => expect(badge.textContent).toBe('COMING SOON'));
  });

  it('the mega menu trigger has the a11y wiring a disclosure needs (aria-haspopup/expanded/controls)', async () => {
    const body = await renderNav('en');
    const trigger = getByRole(body, 'button', { name: /product/i });
    expect(trigger.getAttribute('aria-haspopup')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-controls')).toBe('mega-menu-product');
  });

  it('defaults the CTA to "Get early access" (PUBLIC_GA_LAUNCHED unset/false)', async () => {
    const body = await renderNav('en');
    const nav = within(desktopNav(body).parentElement!);
    expect(nav.getAllByRole('link', { name: /get early access/i })[0]).toBeTruthy();
  });

  it('renders the mobile drawer toggle with aria-expanded/controls, and the drawer links', async () => {
    const body = await renderNav('en');
    const toggle = body.querySelector('[data-drawer-toggle]');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(toggle?.getAttribute('aria-controls')).toBe('site-nav-drawer');
    const drawer = body.querySelector('#site-nav-drawer');
    expect(drawer?.querySelectorAll('.drawer-link')).toHaveLength(7);
  });
});
