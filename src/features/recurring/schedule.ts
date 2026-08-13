import dayjs from "dayjs";

import type { RecurrenceFrequency } from "@/generated/prisma/client";
import { APP_TIME_ZONE } from "@/lib/dates";

type FollowingOccurrenceInput = {
  startsAt: Date;
  currentAt: Date;
  frequency: RecurrenceFrequency;
  interval: number;
};

const WALL_TIME_FORMAT = "YYYY-MM-DD HH:mm:ss.SSS";

function createAnchoredDate(year: number, month: number, day: number, startsAt: Date) {
  const anchor = dayjs(startsAt).tz(APP_TIME_ZONE);
  const monthStart = dayjs.tz(
    `${year}-${String(month + 1).padStart(2, "0")}-01 ${anchor.format("HH:mm:ss.SSS")}`,
    WALL_TIME_FORMAT,
    APP_TIME_ZONE,
  );

  const normalizedDay = Math.min(day, monthStart.daysInMonth());

  return dayjs
    .tz(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(normalizedDay).padStart(
        2,
        "0",
      )} ${anchor.format("HH:mm:ss.SSS")}`,
      WALL_TIME_FORMAT,
      APP_TIME_ZONE,
    )
    .utc()
    .toDate();
}

export function getFollowingRecurringOccurrence({
  startsAt,
  currentAt,
  frequency,
  interval,
}: FollowingOccurrenceInput) {
  if (!Number.isInteger(interval) || interval < 1) {
    throw new Error("Recurring interval must be a positive integer.");
  }

  const anchor = dayjs(startsAt).tz(APP_TIME_ZONE);
  const current = dayjs(currentAt).tz(APP_TIME_ZONE);

  if (frequency === "DAILY" || frequency === "WEEKLY") {
    const daysToAdd = frequency === "DAILY" ? interval : interval * 7;
    const target = current.add(daysToAdd, "day");

    return createAnchoredDate(target.year(), target.month(), target.date(), startsAt);
  }

  if (frequency === "MONTHLY") {
    const targetMonth = current.startOf("month").add(interval, "month");

    return createAnchoredDate(targetMonth.year(), targetMonth.month(), anchor.date(), startsAt);
  }

  return createAnchoredDate(current.year() + interval, anchor.month(), anchor.date(), startsAt);
}

export function isRecurringOccurrenceAllowed(occurrence: Date, endsAt: Date | null) {
  return endsAt === null || occurrence.getTime() <= endsAt.getTime();
}
