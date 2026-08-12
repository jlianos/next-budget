import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export const APP_TIME_ZONE = "Europe/Athens";

const DATE_FORMAT = "YYYY-MM-DD";
const DATE_TIME_LOCAL_FORMAT = "YYYY-MM-DDTHH:mm";

export type DateRange = {
  from: string;
  to: string;
  start: Date;
  endExclusive: Date;
};

function parseCalendarDate(value: string | undefined): Dayjs | null {
  if (!value) {
    return null;
  }

  const strictlyParsed = dayjs(value, DATE_FORMAT, true);

  if (!strictlyParsed.isValid()) {
    return null;
  }

  return dayjs.tz(value, DATE_FORMAT, APP_TIME_ZONE).startOf("day");
}

export function getDateRange(from: string | undefined, to: string | undefined, now = new Date()): DateRange {
  const currentMonthStart = dayjs(now).tz(APP_TIME_ZONE).startOf("month");

  const currentMonthEnd = currentMonthStart.endOf("month");

  let normalizedFrom = parseCalendarDate(from) ?? currentMonthStart;

  let normalizedTo = parseCalendarDate(to) ?? currentMonthEnd;

  if (normalizedFrom.isAfter(normalizedTo)) {
    normalizedFrom = currentMonthStart;
    normalizedTo = currentMonthEnd;
  }

  return {
    from: normalizedFrom.format(DATE_FORMAT),
    to: normalizedTo.format(DATE_FORMAT),
    start: normalizedFrom.utc().toDate(),
    endExclusive: normalizedTo.add(1, "day").startOf("day").utc().toDate(),
  };
}

export function formatDateTime(value: string | Date) {
  return dayjs(value).tz(APP_TIME_ZONE).format("D MMM YYYY, HH:mm");
}

export function parseDateTime(value: string) {
  const strictlyParsed = dayjs(value, DATE_TIME_LOCAL_FORMAT, true);

  if (!strictlyParsed.isValid()) {
    throw new Error("Invalid date and time.");
  }

  return dayjs.tz(value, DATE_TIME_LOCAL_FORMAT, APP_TIME_ZONE).utc().toDate();
}

export function formatDateTimeInput(value: string | Date = new Date()) {
  return dayjs(value).tz(APP_TIME_ZONE).format(DATE_TIME_LOCAL_FORMAT);
}
