import * as v from "valibot";

import { DatabaseIdSchema, DateTimeLocalSchema, PositiveAmountSchema } from "@/lib/validation";

const RecurrenceFrequencySchema = v.picklist(
  ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
  "Please select a recurrence frequency.",
);

const RecurrenceIntervalSchema = v.pipe(
  v.string("Please enter an interval."),
  v.trim(),
  v.nonEmpty("Please enter an interval."),
  v.regex(/^\d+$/, "Interval must be a whole number."),
  v.toNumber("Interval must be a whole number."),
  v.safeInteger("Interval must be a whole number."),
  v.minValue(1, "Interval must be at least 1."),
);

const OptionalEndDateSchema = v.union([v.literal(""), DateTimeLocalSchema]);

export const CreateRecurringTransactionSchema = v.pipe(
  v.object({
    amount: PositiveAmountSchema,
    walletId: DatabaseIdSchema,
    categoryId: DatabaseIdSchema,
    frequency: RecurrenceFrequencySchema,
    interval: RecurrenceIntervalSchema,
    startsAt: DateTimeLocalSchema,
    endsAt: OptionalEndDateSchema,
  }),
  v.forward(
    v.partialCheck(
      [["startsAt"], ["endsAt"]],
      ({ startsAt, endsAt }) => endsAt === "" || endsAt >= startsAt,
      "The end date cannot be earlier than the start date.",
    ),
    ["endsAt"],
  ),
);

export type RecurringTransactionField =
  | "amount"
  | "walletId"
  | "categoryId"
  | "frequency"
  | "interval"
  | "startsAt"
  | "endsAt";

export type RecurringTransactionFormState = {
  fieldErrors?: Partial<Record<RecurringTransactionField, readonly string[]>>;
  formError?: string;
  successMessage?: string;
};

export const initialRecurringTransactionFormState: RecurringTransactionFormState = {};

export type RecurringStatusState = {
  formError?: string;
  successMessage?: string;
};

export const initialRecurringStatusState: RecurringStatusState = {};
