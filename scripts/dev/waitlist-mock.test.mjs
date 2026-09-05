import { describe, expect, it } from 'vitest';
import { extractEmail, handleWaitlistRequest } from './waitlist-mock.mjs';

const MULTIPART_OK = [
  '------formBoundary123',
  'Content-Disposition: form-data; name="email"',
  '',
  'you@company.com',
  '------formBoundary123',
  'Content-Disposition: form-data; name="country"',
  '',
  'ES',
  '------formBoundary123--',
  '',
].join('\r\n');

const MULTIPART_FAIL = MULTIPART_OK.replace('you@company.com', 'fail@x.com');

describe('extractEmail', () => {
  it('reads the email value out of a multipart/form-data body', () => {
    expect(extractEmail(MULTIPART_OK)).toBe('you@company.com');
  });

  it('falls back to application/x-www-form-urlencoded (native no-JS POST)', () => {
    expect(extractEmail('email=fail%40x.com&country=ES')).toBe('fail@x.com');
  });

  it('returns an empty string for a body with no email field', () => {
    expect(extractEmail('')).toBe('');
  });
});

describe('handleWaitlistRequest (CU-W7-1/4, honest mock of Formspree)', () => {
  it('POST with a normal email -> 200 {"ok":true}', () => {
    expect(handleWaitlistRequest('POST', MULTIPART_OK)).toEqual({
      status: 200,
      body: { ok: true },
    });
  });

  it('POST with an email starting with "fail@" -> 422 with an errors[] body', () => {
    const result = handleWaitlistRequest('POST', MULTIPART_FAIL);
    expect(result.status).toBe(422);
    expect(result.body.errors[0].message).toBe('mock: rejected');
  });

  it('any other method -> 405', () => {
    expect(handleWaitlistRequest('GET', '').status).toBe(405);
    expect(handleWaitlistRequest('PUT', MULTIPART_OK).status).toBe(405);
  });
});
