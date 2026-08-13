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

export function formatDateTime(value: string | Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
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

export type ReportGranularity = "day" | "month";

export type ReportDateBucket = {
  key: string;
  label: string;
};

export function getReportDateBuckets(
  start: Date,
  endExclusive: Date,
): {
  granularity: ReportGranularity;
  buckets: ReportDateBucket[];
} {
  const rangeStart = dayjs(start).tz(APP_TIME_ZONE);
  const rangeEnd = dayjs(endExclusive).tz(APP_TIME_ZONE);

  const calendarDays = rangeEnd.startOf("day").diff(rangeStart.startOf("day"), "day");

  const granularity: ReportGranularity = calendarDays <= 62 ? "day" : "month";

  const buckets: ReportDateBucket[] = [];

  let cursor = rangeStart.startOf(granularity);

  while (cursor.isBefore(rangeEnd)) {
    buckets.push({
      key: granularity === "day" ? cursor.format("YYYY-MM-DD") : cursor.format("YYYY-MM"),
      label: granularity === "day" ? cursor.format("D MMM") : cursor.format("MMM YYYY"),
    });

    cursor = cursor.add(1, granularity);
  }

  return {
    granularity,
    buckets,
  };
}

export function getReportBucketKey(value: string | Date, granularity: ReportGranularity) {
  const date = dayjs(value).tz(APP_TIME_ZONE);

  return granularity === "day" ? date.format("YYYY-MM-DD") : date.format("YYYY-MM");
}
