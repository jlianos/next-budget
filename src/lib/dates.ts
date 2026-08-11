import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const DATE_FORMAT = "YYYY-MM-DD";

export type OverviewDateRange = {
  from: string;
  to: string;
  start: Date;
  endExclusive: Date;
};

function parseDate(value: string | undefined): Dayjs | null {
  if (!value) {
    return null;
  }

  const parsed = dayjs.utc(value, DATE_FORMAT, true);

  return parsed.isValid() ? parsed.startOf("day") : null;
}

export function getOverviewDateRange(
  from: string | undefined,
  to: string | undefined,
  now = new Date(),
): OverviewDateRange {
  const currentMonthStart = dayjs.utc(now).startOf("month");
  const currentMonthEnd = currentMonthStart.endOf("month");

  let normalizedFrom = parseDate(from) ?? currentMonthStart;
  let normalizedTo = parseDate(to) ?? currentMonthEnd;

  if (normalizedFrom.isAfter(normalizedTo)) {
    normalizedFrom = currentMonthStart;
    normalizedTo = currentMonthEnd;
  }

  return {
    from: normalizedFrom.format(DATE_FORMAT),
    to: normalizedTo.format(DATE_FORMAT),
    start: normalizedFrom.toDate(),
    endExclusive: normalizedTo.add(1, "day").startOf("day").toDate(),
  };
}
