import prisma from "@/db/prisma";

import { getFollowingRecurringOccurrence, isRecurringOccurrenceAllowed } from "./schedule";

const SCHEDULE_BATCH_SIZE = 25;
const MAX_OCCURRENCES_PER_SCHEDULE = 100;

export type RecurringGenerationResult = {
  schedulesProcessed: number;
  occurrencesHandled: number;
  failures: number;
};

export async function generateDueRecurringTransactions(now = new Date()): Promise<RecurringGenerationResult> {
  const dueSchedules = await prisma.recurringTransaction.findMany({
    where: {
      isActive: true,
      nextAt: {
        lte: now,
      },
    },
    orderBy: {
      nextAt: "asc",
    },
    take: SCHEDULE_BATCH_SIZE,
    select: {
      id: true,
    },
  });

  let schedulesProcessed = 0;
  let occurrencesHandled = 0;
  let failures = 0;

  for (const dueSchedule of dueSchedules) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const schedule = await tx.recurringTransaction.findUnique({
          where: {
            id: dueSchedule.id,
          },
          select: {
            id: true,
            amount: true,
            walletId: true,
            categoryId: true,
            createdById: true,
            frequency: true,
            interval: true,
            startsAt: true,
            endsAt: true,
            nextAt: true,
            isActive: true,
          },
        });

        if (!schedule || !schedule.isActive || schedule.nextAt.getTime() > now.getTime()) {
          return {
            processed: false,
            occurrencesHandled: 0,
          };
        }

        const originalNextAt = schedule.nextAt;
        let nextAt = schedule.nextAt;
        let handled = 0;

        while (
          nextAt.getTime() <= now.getTime() &&
          isRecurringOccurrenceAllowed(nextAt, schedule.endsAt) &&
          handled < MAX_OCCURRENCES_PER_SCHEDULE
        ) {
          await tx.transaction.upsert({
            where: {
              recurringTransactionId_occurredAt: {
                recurringTransactionId: schedule.id,
                occurredAt: nextAt,
              },
            },
            update: {},
            create: {
              amount: schedule.amount,
              walletId: schedule.walletId,
              categoryId: schedule.categoryId,
              createdById: schedule.createdById,
              recurringTransactionId: schedule.id,
              occurredAt: nextAt,
            },
          });

          handled += 1;

          nextAt = getFollowingRecurringOccurrence({
            startsAt: schedule.startsAt,
            currentAt: nextAt,
            frequency: schedule.frequency,
            interval: schedule.interval,
          });
        }

        const remainsActive = isRecurringOccurrenceAllowed(nextAt, schedule.endsAt);

        const updateResult = await tx.recurringTransaction.updateMany({
          where: {
            id: schedule.id,
            isActive: true,
            nextAt: originalNextAt,
          },
          data: {
            nextAt,
            isActive: remainsActive,
          },
        });

        return {
          processed: updateResult.count === 1,
          occurrencesHandled: updateResult.count === 1 ? handled : 0,
        };
      });

      if (result.processed) {
        schedulesProcessed += 1;
        occurrencesHandled += result.occurrencesHandled;
      }
    } catch (error) {
      failures += 1;

      console.error(`Unable to generate recurring schedule ${dueSchedule.id}:`, error);
    }
  }

  return {
    schedulesProcessed,
    occurrencesHandled,
    failures,
  };
}
