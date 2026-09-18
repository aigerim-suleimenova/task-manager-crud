import { userInitials } from './user-initials';

describe('userInitials', () => {
  it('uppercases the first two characters of the email', () => {
    expect(userInitials('jane@acme.com')).toBe('JA');
  });

  it('handles a one-character local part', () => {
    expect(userInitials('a@example.com')).toBe('A@');
  });

  it('handles already-mixed-case emails consistently', () => {
    expect(userInitials('Bob@example.com')).toBe('BO');
  });

  it('handles an empty string without throwing', () => {
    expect(userInitials('')).toBe('');
  });
});
