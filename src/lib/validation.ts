import * as v from "valibot";

export const DatabaseIdSchema = v.pipe(
  v.string("Please select an option."),
  v.trim(),
  v.nonEmpty("Please select an option."),
  v.regex(/^\d+$/, "The selected option is invalid."),
  v.toNumber("The selected option is invalid."),
  v.safeInteger("The selected option is invalid."),
  v.minValue(1, "The selected option is invalid."),
);

export const PositiveAmountSchema = v.pipe(
  v.string("Please enter an amount."),
  v.trim(),
  v.nonEmpty("Please enter an amount."),
  v.decimal("Please enter a valid amount."),
  v.regex(/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/, "Use no more than 12 whole digits and 2 decimal places."),
  v.check((amount) => /[1-9]/.test(amount), "Amount must be greater than zero."),
);

export const DateTimeLocalSchema = v.pipe(
  v.string("Please select a date and time."),
  v.trim(),
  v.nonEmpty("Please select a date and time."),
  v.isoDateTime("Please select a valid date and time."),
);
