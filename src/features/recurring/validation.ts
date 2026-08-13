import * as v from "valibot";

type RecurringValidationMessages = {
  selectOption: string;
  invalidOption: string;
  amountRequired: string;
  amountInvalid: string;
  amountPrecision: string;
  amountPositive: string;
  frequencyRequired: string;
  intervalRequired: string;
  intervalWhole: string;
  intervalMinimum: string;
  dateRequired: string;
  dateInvalid: string;
  endBeforeStart: string;
};

export function createRecurringTransactionSchema(messages: RecurringValidationMessages) {
  const DatabaseIdSchema = v.pipe(
    v.string(messages.selectOption),
    v.trim(),
    v.nonEmpty(messages.selectOption),
    v.regex(/^\d+$/, messages.invalidOption),
    v.toNumber(messages.invalidOption),
    v.safeInteger(messages.invalidOption),
    v.minValue(1, messages.invalidOption),
  );

  const PositiveAmountSchema = v.pipe(
    v.string(messages.amountRequired),
    v.trim(),
    v.nonEmpty(messages.amountRequired),
    v.decimal(messages.amountInvalid),
    v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/, messages.amountPrecision),
    v.check((amount) => /[1-9]/.test(amount), messages.amountPositive),
  );

  const DateTimeLocalSchema = v.pipe(
    v.string(messages.dateRequired),
    v.trim(),
    v.nonEmpty(messages.dateRequired),
    v.isoDateTime(messages.dateInvalid),
  );

  const RecurrenceFrequencySchema = v.picklist(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"], messages.frequencyRequired);

  const RecurrenceIntervalSchema = v.pipe(
    v.string(messages.intervalRequired),
    v.trim(),
    v.nonEmpty(messages.intervalRequired),
    v.regex(/^\d+$/, messages.intervalWhole),
    v.toNumber(messages.intervalWhole),
    v.safeInteger(messages.intervalWhole),
    v.minValue(1, messages.intervalMinimum),
  );

  const OptionalEndDateSchema = v.union([v.literal(""), DateTimeLocalSchema]);

  return v.pipe(
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
        messages.endBeforeStart,
      ),
      ["endsAt"],
    ),
  );
}

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
