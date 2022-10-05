import { TzDate } from '~/util/date';

// could've actually used some sort of forceType utility type but this is easier
export function forceFloat<T = number>(s: T) {
  return parseFloat(s as unknown as string);
}

export function forceInt<T = number>(s: T) {
  return parseInt(s as unknown as string);
}

export function forceTzDate<T = Date>(s: T) {
  return TzDate(s as unknown as string);
}
