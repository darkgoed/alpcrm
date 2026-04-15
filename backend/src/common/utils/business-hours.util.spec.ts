import { isWithinBusinessHours } from './business-hours.util';

describe('isWithinBusinessHours', () => {
  it('returns true when businessHours is null (no restriction)', () => {
    expect(isWithinBusinessHours(null, 'America/Sao_Paulo')).toBe(true);
  });

  it('returns false when the current day is disabled', () => {
    // Build a businessHours config where every day is disabled
    const allDisabled = {
      mon: { enabled: false, open: '09:00', close: '18:00' },
      tue: { enabled: false, open: '09:00', close: '18:00' },
      wed: { enabled: false, open: '09:00', close: '18:00' },
      thu: { enabled: false, open: '09:00', close: '18:00' },
      fri: { enabled: false, open: '09:00', close: '18:00' },
      sat: { enabled: false, open: '09:00', close: '18:00' },
      sun: { enabled: false, open: '09:00', close: '18:00' },
    };
    expect(isWithinBusinessHours(allDisabled, 'America/Sao_Paulo')).toBe(false);
  });

  it('returns true when all days are enabled with a full-day window', () => {
    // Window from 00:00 to 23:59 covers any time
    const allDay = {
      mon: { enabled: true, open: '00:00', close: '23:59' },
      tue: { enabled: true, open: '00:00', close: '23:59' },
      wed: { enabled: true, open: '00:00', close: '23:59' },
      thu: { enabled: true, open: '00:00', close: '23:59' },
      fri: { enabled: true, open: '00:00', close: '23:59' },
      sat: { enabled: true, open: '00:00', close: '23:59' },
      sun: { enabled: true, open: '00:00', close: '23:59' },
    };
    expect(isWithinBusinessHours(allDay, 'UTC')).toBe(true);
  });

  it('returns false when day key is missing from config', () => {
    // Empty config: all days missing = disabled
    expect(isWithinBusinessHours({}, 'UTC')).toBe(false);
  });
});
