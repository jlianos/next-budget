import assert from "node:assert/strict";

import prisma from "@/db/prisma";
import { generateDueRecurringTransactions } from "@/features/recurring/generation";
import { parseDateTime } from "@/lib/dates";

const WORKSPACE_ID = "recurring-generator-tests";
const TEST_NOW = parseDateTime("2026-04-15T12:00");

function expectedDate(value: string) {
  return parseDateTime(value).toISOString();
}

async function getScenario(amount: string) {
  const schedule = await prisma.recurringTransaction.findFirst({
    where: {
      amount,
      wallet: {
        workspaceId: WORKSPACE_ID,
      },
    },
    select: {
      id: true,
      isActive: true,
      nextAt: true,
      transactions: {
        orderBy: {
          occurredAt: "asc",
        },
        select: {
          occurredAt: true,
        },
      },
    },
  });

  assert.ok(schedule, `Scenario ${amount} was not found.`);

  return schedule;
}

function occurrenceDates(schedule: Awaited<ReturnType<typeof getScenario>>) {
  return schedule.transactions.map((transaction) => transaction.occurredAt.toISOString());
}

async function main() {
  console.log("🧪 Running recurring-generator integration checks...");

  const workspace = await prisma.workspace.findUnique({
    where: {
      id: WORKSPACE_ID,
    },
    select: {
      id: true,
    },
  });

  assert.ok(workspace, "Generator workspace is missing. Run npm run seed first.");

  // -------------------------------------------------------------------------
  // First pass
  // -------------------------------------------------------------------------

  const firstPass = await generateDueRecurringTransactions(TEST_NOW);

  console.log("First generation pass:", firstPass);

  const everyTwoDays = await getScenario("201.00");

  assert.equal(everyTwoDays.transactions.length, 53);
  assert.equal(everyTwoDays.isActive, true);
  assert.equal(everyTwoDays.nextAt.toISOString(), expectedDate("2026-04-17T09:00"));

  assert.deepEqual(occurrenceDates(everyTwoDays).slice(0, 4), [
    expectedDate("2026-01-01T09:00"),
    expectedDate("2026-01-03T09:00"),
    expectedDate("2026-01-05T09:00"),
    expectedDate("2026-01-07T09:00"),
  ]);

  const everyTwoMonths = await getScenario("202.00");

  assert.deepEqual(occurrenceDates(everyTwoMonths), [
    expectedDate("2026-01-31T09:00"),
    expectedDate("2026-03-31T09:00"),
  ]);

  assert.equal(everyTwoMonths.isActive, true);
  assert.equal(everyTwoMonths.nextAt.toISOString(), expectedDate("2026-05-31T09:00"));

  const inclusiveEnd = await getScenario("203.00");

  assert.deepEqual(occurrenceDates(inclusiveEnd), [
    expectedDate("2026-01-01T09:00"),
    expectedDate("2026-01-03T09:00"),
    expectedDate("2026-01-05T09:00"),
  ]);

  assert.equal(inclusiveEnd.isActive, false);
  assert.equal(inclusiveEnd.nextAt.toISOString(), expectedDate("2026-01-07T09:00"));

  const alreadyEnded = await getScenario("204.00");

  assert.equal(alreadyEnded.transactions.length, 0);
  assert.equal(alreadyEnded.isActive, false);
  assert.equal(alreadyEnded.nextAt.toISOString(), expectedDate("2026-01-05T09:00"));

  const inactive = await getScenario("205.00");

  assert.equal(inactive.transactions.length, 0);
  assert.equal(inactive.isActive, false);
  assert.equal(inactive.nextAt.toISOString(), expectedDate("2026-01-01T09:00"));

  const cappedAfterFirstPass = await getScenario("206.00");

  assert.equal(cappedAfterFirstPass.transactions.length, 100);
  assert.equal(cappedAfterFirstPass.isActive, true);
  assert.equal(cappedAfterFirstPass.nextAt.toISOString(), expectedDate("2026-04-11T09:00"));

  // -------------------------------------------------------------------------
  // Second pass: continue after the 100-occurrence limit
  // -------------------------------------------------------------------------

  const secondPass = await generateDueRecurringTransactions(TEST_NOW);

  console.log("Second generation pass:", secondPass);

  const cappedAfterSecondPass = await getScenario("206.00");

  assert.equal(cappedAfterSecondPass.transactions.length, 105);
  assert.equal(cappedAfterSecondPass.isActive, true);
  assert.equal(cappedAfterSecondPass.nextAt.toISOString(), expectedDate("2026-04-16T09:00"));

  // -------------------------------------------------------------------------
  // Third pass: prove idempotency after everything is caught up
  // -------------------------------------------------------------------------

  await generateDueRecurringTransactions(TEST_NOW);

  const schedules = await prisma.recurringTransaction.findMany({
    where: {
      wallet: {
        workspaceId: WORKSPACE_ID,
      },
    },
    select: {
      amount: true,
      _count: {
        select: {
          transactions: true,
        },
      },
    },
  });

  const counts = Object.fromEntries(
    schedules.map((schedule) => [schedule.amount.toFixed(2), schedule._count.transactions]),
  );

  assert.deepEqual(counts, {
    "201.00": 53,
    "202.00": 2,
    "203.00": 3,
    "204.00": 0,
    "205.00": 0,
    "206.00": 105,
  });

  console.log("✅ All recurring-generator integration checks passed");
  console.table(counts);
}

main()
  .catch((error) => {
    console.error("❌ Recurring-generator integration check failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
