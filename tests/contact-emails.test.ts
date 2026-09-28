import { describe, it, expect } from 'vitest';
import { buildNotification, buildAutoReply, escapeHtml } from '../src/lib/contact-emails';

const values = {
  name: 'Jordan Reid',
  email: 'jordan@example.com',
  phone: '(501) 555-0100',
  message: 'Line one.\nLine two with <b>tags</b>.',
};

describe('buildNotification', () => {
  it('names the enquirer in the subject', () => {
    expect(buildNotification(values).subject).toBe('Website enquiry from Jordan Reid');
  });
  it('carries every field in both the HTML and the text', () => {
    const mail = buildNotification(values);
    for (const s of ['Jordan Reid', 'jordan@example.com', '(501) 555-0100', 'Line one.']) {
      expect(mail.html).toContain(s);
      expect(mail.text).toContain(s);
    }
  });
  it('escapes HTML in the message rather than rendering it', () => {
    expect(buildNotification(values).html).toContain('&lt;b&gt;tags&lt;/b&gt;');
    expect(buildNotification(values).html).not.toContain('<b>tags</b>');
  });
  it('turns line breaks into <br>', () => {
    expect(buildNotification(values).html).toContain('Line one.<br>Line two');
  });
  it('says "not given" when there is no phone', () => {
    expect(buildNotification({ ...values, phone: '' }).html).toContain('not given');
  });
  it('labels a preview submission in the subject and body', () => {
    const mail = buildNotification(values, 'PREVIEW');
    expect(mail.subject.startsWith('[PREVIEW] ')).toBe(true);
    expect(mail.html).toContain('It is a test.');
    expect(mail.text).toContain('TEST');
  });
  it('does not label a production submission', () => {
    const mail = buildNotification(values);
    expect(mail.subject).not.toContain('[');
    expect(mail.html).not.toContain('It is a test.');
  });
});

describe('buildAutoReply', () => {
  it('greets by first name', () => {
    expect(buildAutoReply(values).html).toContain('Thanks, Jordan.');
  });
  it('repeats the 48 hour promise from the page', () => {
    expect(buildAutoReply(values).text).toContain('48 hours');
  });
  it('quotes the message back, escaped', () => {
    expect(buildAutoReply(values).html).toContain('&lt;b&gt;tags&lt;/b&gt;');
  });
  it('falls back to "there" when the name is blank', () => {
    expect(buildAutoReply({ ...values, name: '' }).html).toContain('Thanks, there.');
  });
});

describe('escapeHtml', () => {
  it('escapes the four characters that matter', () => {
    expect(escapeHtml('<a href="x">&</a>')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;');
  });
});
