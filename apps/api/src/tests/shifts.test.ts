import { describe, it, expect } from 'vitest';

describe('Shift overlap detection', () => {
  it('should detect overlapping shifts', () => {
    const shift1 = {
      start: new Date('2024-01-15T08:00:00'),
      end: new Date('2024-01-15T16:00:00'),
    };

    const shift2 = {
      start: new Date('2024-01-15T14:00:00'),
      end: new Date('2024-01-15T22:00:00'),
    };

    const overlaps = shift1.end > shift2.start && shift2.end > shift1.start;
    expect(overlaps).toBe(true);
  });

  it('should not detect non-overlapping shifts', () => {
    const shift1 = {
      start: new Date('2024-01-15T08:00:00'),
      end: new Date('2024-01-15T16:00:00'),
    };

    const shift2 = {
      start: new Date('2024-01-15T16:00:00'),
      end: new Date('2024-01-15T22:00:00'),
    };

    const overlaps = shift1.end > shift2.start && shift2.end > shift1.start;
    expect(overlaps).toBe(false);
  });
});

describe('Publish lock validation', () => {
  it('should prevent modification before published date', () => {
    const publishedUntil = new Date('2024-01-31');
    const shiftStart = new Date('2024-01-15');
    
    const isLocked = shiftStart <= publishedUntil;
    expect(isLocked).toBe(true);
  });

  it('should allow modification after published date', () => {
    const publishedUntil = new Date('2024-01-31');
    const shiftStart = new Date('2024-02-01');
    
    const isLocked = shiftStart <= publishedUntil;
    expect(isLocked).toBe(false);
  });
});
