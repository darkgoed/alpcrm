type DayHours = { enabled: boolean; open: string; close: string };
type BusinessHours = Record<string, DayHours>;

/**
 * Returns true if the current moment falls within the configured business hours
 * for the given timezone. Returns true when businessHours is null (no restriction).
 */
export function isWithinBusinessHours(
  businessHours: BusinessHours | null,
  timezone: string,
): boolean {
  if (!businessHours) return true;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const weekday =
    parts
      .find((p) => p.type === 'weekday')
      ?.value?.toLowerCase()
      .slice(0, 3) ?? '';
  const hour =
    parts.find((p) => p.type === 'hour')?.value?.padStart(2, '0') ?? '00';
  const minute =
    parts.find((p) => p.type === 'minute')?.value?.padStart(2, '0') ?? '00';

  const day = businessHours[weekday];
  if (!day?.enabled) return false;

  const current = `${hour}:${minute}`;
  return current >= day.open && current < day.close;
}
