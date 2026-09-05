import { getByRole } from '@testing-library/dom';
import { describe, expect, it } from 'vitest';
import { renderToBody } from '../test/render-astro';
import LangSwitch from './LangSwitch.astro';

describe('LangSwitch', () => {
  it('marks the current locale as aria-current="page" and links the other one to its localized path', async () => {
    const body = await renderToBody(LangSwitch, { props: { locale: 'en', pathname: '/voice' } });
    const en = getByRole(body, 'link', { name: 'EN' });
    const es = getByRole(body, 'link', { name: 'ES' });
    expect(en.getAttribute('aria-current')).toBe('page');
    expect(en.getAttribute('href')).toBe('/voice');
    expect(es.getAttribute('aria-current')).toBeNull();
    expect(es.getAttribute('href')).toBe('/es/voice');
  });

  it('preserves the route the other way (es -> en) and translates the group label (regression: W-1 hard-coded "Language" on both locales)', async () => {
    const body = await renderToBody(LangSwitch, { props: { locale: 'es', pathname: '/es/voice' } });
    const group = body.querySelector('[role="group"]');
    expect(group?.getAttribute('aria-label')).toBe('Idioma');
    expect(getByRole(body, 'link', { name: 'ES' }).getAttribute('aria-current')).toBe('page');
    expect(getByRole(body, 'link', { name: 'EN' }).getAttribute('href')).toBe('/voice');
  });

  it('maps the homepage both ways (/ <-> /es/)', async () => {
    const body = await renderToBody(LangSwitch, { props: { locale: 'en', pathname: '/' } });
    expect(getByRole(body, 'link', { name: 'ES' }).getAttribute('href')).toBe('/es/');
  });
});
