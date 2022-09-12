/**
 * validate postgres date (pg does this but seems flexible so best to do it here)
 */
export function assertValidDate(s: string) {
  if (!s.match(/\d\d\d\d-\d\d-\d\d/)?.length) {
    throw new Error('Invalid date, must be YYYY-MM-DD');
  }
}

const DATE_OFFSET = new Date().getTimezoneOffset() * 60 * 1_000;

/**
 * Treat the date string as if it were in the browser's timezone.
 */
export function TzDate(s: string) {
  assertValidDate(s);
  const utc = new Date(s);
  utc.setTime(utc.getTime() + DATE_OFFSET);

  return utc;
}
