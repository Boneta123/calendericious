import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatBirthday,
  isValidBirthday,
  sanitizeBirthdayInput,
  toStoredBirthday,
} from '../../frontend/utils/birthday.ts';

describe('sanitizeBirthdayInput', () => {
  it('strips non-digits and inserts the slash', () => {
    assert.equal(sanitizeBirthdayInput('0704'), '07/04');
    assert.equal(sanitizeBirthdayInput('07/04'), '07/04');
    assert.equal(sanitizeBirthdayInput('ab0c7'), '07');
  });

  it('caps input at four digits', () => {
    assert.equal(sanitizeBirthdayInput('123456'), '12/34');
  });
});

describe('isValidBirthday', () => {
  it('accepts real month/day pairs in either separator', () => {
    assert.equal(isValidBirthday('07/04'), true);
    assert.equal(isValidBirthday('7-4'), true);
    assert.equal(isValidBirthday('02/29'), true); // leap-day birthdays are valid
  });

  it('rejects impossible dates and bad shapes', () => {
    assert.equal(isValidBirthday('13/01'), false);
    assert.equal(isValidBirthday('00/10'), false);
    assert.equal(isValidBirthday('02/30'), false);
    assert.equal(isValidBirthday('04/31'), false);
    assert.equal(isValidBirthday('hello'), false);
    assert.equal(isValidBirthday(''), false);
  });
});

describe('toStoredBirthday', () => {
  it('zero-pads into MM-DD', () => {
    assert.equal(toStoredBirthday('7/4'), '07-04');
    assert.equal(toStoredBirthday('12-25'), '12-25');
  });

  it('returns "" for unparseable input', () => {
    assert.equal(toStoredBirthday('nope'), '');
  });
});

describe('formatBirthday', () => {
  it('renders "Mon D"', () => {
    assert.equal(formatBirthday('07-04'), 'Jul 4');
    assert.equal(formatBirthday('12-25'), 'Dec 25');
  });

  it('returns "" for null, undefined and invalid months', () => {
    assert.equal(formatBirthday(null), '');
    assert.equal(formatBirthday(undefined), '');
    assert.equal(formatBirthday('13-01'), '');
  });
});
