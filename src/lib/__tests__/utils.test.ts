import {
  cn,
  formatCurrency,
  formatNumber,
  shortenAddress,
  formatDate,
  sleep,
  isValidAddress,
} from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('handles falsy values', () => {
    const result = cn('base', false, null, undefined, 'valid');
    expect(result).toBe('base valid');
  });

  it('merges tailwind classes correctly', () => {
    const result = cn('px-4', 'px-6');
    expect(result).toBe('px-6');
  });

  it('handles array of classes', () => {
    const result = cn(['class1', 'class2']);
    expect(result).toBe('class1 class2');
  });

  it('handles object syntax', () => {
    const result = cn({ active: true, disabled: false });
    expect(result).toBe('active');
  });
});

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    const result = formatCurrency(1234.56);
    expect(result).toBe('$1,234.56');
  });

  it('formats other currencies', () => {
    const result = formatCurrency(1234.56, 'EUR', 'de-DE');
    expect(result).toContain('1.234,56');
  });

  it('handles zero', () => {
    const result = formatCurrency(0);
    expect(result).toBe('$0.00');
  });

  it('handles negative numbers', () => {
    const result = formatCurrency(-100);
    expect(result).toBe('-$100.00');
  });
});

describe('formatNumber', () => {
  it('formats with default 2 decimals', () => {
    const result = formatNumber(1234.5678);
    expect(result).toBe('1,234.57');
  });

  it('formats with custom decimals', () => {
    const result = formatNumber(1234.5678, 4);
    expect(result).toBe('1,234.5678');
  });

  it('formats with 0 decimals', () => {
    const result = formatNumber(1234.5678, 0);
    expect(result).toBe('1,235');
  });

  it('handles integer', () => {
    const result = formatNumber(1234);
    expect(result).toBe('1,234.00');
  });
});

describe('shortenAddress', () => {
  const fullAddress = '0x1234567890abcdef1234567890abcdef12345678';

  it('shortens address with default chars', () => {
    const result = shortenAddress(fullAddress);
    expect(result).toBe('0x1234...5678');
  });

  it('shortens address with custom chars', () => {
    const result = shortenAddress(fullAddress, 6);
    expect(result).toBe('0x123456...345678');
  });

  it('returns empty string for empty input', () => {
    const result = shortenAddress('');
    expect(result).toBe('');
  });

  it('handles undefined gracefully', () => {
    const result = shortenAddress(undefined as unknown as string);
    expect(result).toBe('');
  });
});

describe('formatDate', () => {
  const testDate = new Date('2024-06-15T10:30:00');

  it('formats date with default Spanish locale', () => {
    const result = formatDate(testDate);
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('accepts string date', () => {
    const result = formatDate('2024-06-15T12:00:00');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('accepts custom options', () => {
    const result = formatDate(testDate, { weekday: 'long' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('accepts custom locale', () => {
    const result = formatDate(testDate, undefined, 'en-US');
    expect(result).toContain('June');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });
});

describe('sleep', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves after specified time', async () => {
    const callback = jest.fn();
    const promise = sleep(1000).then(callback);

    expect(callback).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    await promise;

    expect(callback).toHaveBeenCalled();
  });

  it('returns a promise', () => {
    const result = sleep(100);
    expect(result).toBeInstanceOf(Promise);
  });
});

describe('isValidAddress', () => {
  it('returns true for valid Ethereum address', () => {
    expect(isValidAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe(true);
  });

  it('returns true for uppercase hex', () => {
    expect(isValidAddress('0x1234567890ABCDEF1234567890ABCDEF12345678')).toBe(true);
  });

  it('returns true for mixed case', () => {
    expect(isValidAddress('0x1234567890AbCdEf1234567890aBcDeF12345678')).toBe(true);
  });

  it('returns false for address without 0x prefix', () => {
    expect(isValidAddress('1234567890abcdef1234567890abcdef12345678')).toBe(false);
  });

  it('returns false for short address', () => {
    expect(isValidAddress('0x1234567890abcdef')).toBe(false);
  });

  it('returns false for long address', () => {
    expect(isValidAddress('0x1234567890abcdef1234567890abcdef123456789999')).toBe(false);
  });

  it('returns false for invalid characters', () => {
    expect(isValidAddress('0x1234567890ghijkl1234567890ghijkl12345678')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isValidAddress('')).toBe(false);
  });
});
