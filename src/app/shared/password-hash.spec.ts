import { hashPassword } from './password-hash';

describe('hashPassword', () => {
  it('produces the same hash for the same input', async () => {
    const a = await hashPassword('correct-horse-battery-staple');
    const b = await hashPassword('correct-horse-battery-staple');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await hashPassword('password-one');
    const b = await hashPassword('password-two');
    expect(a).not.toBe(b);
  });

  it('returns a 64-character hex string (SHA-256)', async () => {
    const hash = await hashPassword('anything');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
