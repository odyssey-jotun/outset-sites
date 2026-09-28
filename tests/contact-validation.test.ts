import { describe, it, expect } from 'vitest';
import { validateContact, MESSAGE_MAX, type ContactValues } from '../src/lib/contact-validation';

const valid: ContactValues = {
  name: 'Jordan Reid',
  email: 'jordan@example.com',
  phone: '',
  message: 'I run a landscaping company and need a site with a quote form.',
};

describe('validateContact', () => {
  it('accepts a complete, valid submission', () => {
    expect(validateContact(valid)).toEqual({});
  });
  it('does not require a phone number', () => {
    expect(validateContact({ ...valid, phone: '' }).phone).toBeUndefined();
  });
  it('rejects a missing name', () => {
    expect(validateContact({ ...valid, name: '' }).name).toBeTruthy();
  });
  it('treats a whitespace-only name as missing', () => {
    expect(validateContact({ ...valid, name: '   ' }).name).toBeTruthy();
  });
  it('rejects a missing email', () => {
    expect(validateContact({ ...valid, email: '' }).email).toBeTruthy();
  });
  it('rejects an email with no domain', () => {
    expect(validateContact({ ...valid, email: 'jordan@' }).email).toBeTruthy();
  });
  it('accepts a plus-addressed email', () => {
    expect(validateContact({ ...valid, email: 'jordan+web@example.co.uk' }).email).toBeUndefined();
  });
  it('rejects a too-short message', () => {
    expect(validateContact({ ...valid, message: 'hi' }).message).toBeTruthy();
  });
  it('allows more than the old 180-character Forminator cap', () => {
    expect(validateContact({ ...valid, message: 'x'.repeat(500) }).message).toBeUndefined();
  });
  it('rejects a message over the limit', () => {
    expect(validateContact({ ...valid, message: 'x'.repeat(MESSAGE_MAX + 1) }).message).toBeTruthy();
  });
  it('reports every problem at once', () => {
    const e = validateContact({ name: '', email: 'bad', phone: '', message: '' });
    expect(Object.keys(e).sort()).toEqual(['email', 'message', 'name']);
  });
  it('tolerates missing fields without throwing', () => {
    expect(() => validateContact({} as ContactValues)).not.toThrow();
  });
});
