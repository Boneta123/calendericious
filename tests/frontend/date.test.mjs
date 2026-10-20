import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildMonthGrid,
  formatClock,
  formatLongDate,
  fromDateKey,
  isSameDay,
  toDateKey,
} from '../../frontend/utils/date.ts';

describe('buildMonthGrid', () => {
  it('always returns 42 consecutive days', () => {
    const grid = buildMonthGrid(2026, 1); // Feb 2026
    assert.equal(grid.length, 42);
    for (let i = 1; i < grid.length; i++) {
      const gap = new Date(grid[i - 1].getFullYear(), grid[i - 1].getMonth(), grid[i - 1].getDate() + 1);
      assert.ok(isSameDay(gap, grid[i]));
    }
  });

  it('starts on a Sunday and contains the 1st of the month', () => {
    const grid = buildMonthGrid(2026, 6); // July 2026
    assert.equal(grid[0].getDay(), 0);
    assert.ok(grid.some((d) => isSameDay(d, new Date(2026, 6, 1))));
  });
});

describe('date keys', () => {
  it('round-trips through toDateKey / fromDateKey', () => {
    const d = new Date(2026, 8, 3);
    assert.equal(toDateKey(d), '2026-09-03');
    assert.ok(isSameDay(fromDateKey('2026-09-03'), d));
  });
});

describe('formatLongDate', () => {
  it('formats weekday, month and day', () => {
    assert.equal(formatLongDate(new Date(2026, 6, 28)), 'Tuesday, July 28');
  });
});

describe('formatClock', () => {
  it('converts 24h to 12h with AM/PM', () => {
    assert.equal(formatClock('00:00'), '12:00 AM');
    assert.equal(formatClock('09:30'), '9:30 AM');
    assert.equal(formatClock('12:00'), '12:00 PM');
    assert.equal(formatClock('22:00'), '10:00 PM');
  });
});

describe('isSameDay', () => {
  it('ignores time of day', () => {
    assert.equal(isSameDay(new Date(2026, 0, 1, 1), new Date(2026, 0, 1, 23)), true);
    assert.equal(isSameDay(new Date(2026, 0, 1), new Date(2026, 0, 2)), false);
  });
});
