import { formatDueDate } from './date-format';

describe('formatDueDate', () => {
  it('formats a due date as "Mon D, YYYY"', () => {
    expect(formatDueDate('2024-10-28')).toBe('Oct 28, 2024');
  });

  it('returns an em dash for null', () => {
    expect(formatDueDate(null)).toBe('—');
  });

  it('pads no leading zero onto the day', () => {
    expect(formatDueDate('2024-01-05')).toBe('Jan 5, 2024');
  });

  it('never constructs a Date, so it cannot be shifted by the runtime timezone', () => {
    // The bug this guards against: DatePipe/`new Date('2024-10-28')` parses as
    // UTC midnight, which renders as "Oct 27" in any timezone behind UTC. A
    // pure string-split implementation has no such window — assert the
    // global Date constructor is never touched while formatting.
    const dateSpy = vi.spyOn(globalThis, 'Date');
    expect(formatDueDate('2024-10-28')).toBe('Oct 28, 2024');
    expect(dateSpy).not.toHaveBeenCalled();
    dateSpy.mockRestore();
  });
});
