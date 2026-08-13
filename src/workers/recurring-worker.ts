import { setTimeout as delay } from "node:timers/promises";
import "dotenv/config";
import prisma from "@/db/prisma";
import { generateDueRecurringTransactions } from "@/features/recurring/generation";

const POLL_INTERVAL_MS = 60_000;

const abortController = new AbortController();

function requestShutdown(signal: string) {
  console.log(`Received ${signal}. Stopping recurring worker…`);
  abortController.abort();
}

process.once("SIGINT", () => requestShutdown("SIGINT"));
process.once("SIGTERM", () => requestShutdown("SIGTERM"));

async function runGenerationPass() {
  const startedAt = new Date();

  const result = await generateDueRecurringTransactions(startedAt);

  if (result.schedulesProcessed > 0 || result.occurrencesHandled > 0 || result.failures > 0) {
    console.log("Recurring generation pass completed.", {
      at: startedAt.toISOString(),
      ...result,
    });
  }
}

async function main() {
  const runOnce = process.argv.includes("--once");

  console.log("Recurring worker started.", {
    pollIntervalMs: POLL_INTERVAL_MS,
    runOnce,
  });

  do {
    try {
      await runGenerationPass();
    } catch (error) {
      console.error("Recurring generation pass failed:", error);
    }

    if (runOnce || abortController.signal.aborted) {
      break;
    }

    try {
      await delay(POLL_INTERVAL_MS, undefined, {
        signal: abortController.signal,
      });
    } catch (error) {
      if (!(error instanceof Error) || error.name !== "AbortError") {
        throw error;
      }
    }
  } while (!abortController.signal.aborted);
}

async function startWorker() {
  try {
    await main();
  } catch (error) {
    console.error("Recurring worker failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log("Recurring worker stopped.");
  }
}

void startWorker();
