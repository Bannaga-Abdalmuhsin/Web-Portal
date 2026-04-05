import app from "./app";
import { logger } from "./lib/logger";
import { runSeedIfEmpty } from "./lib/startup-seed";
import { startSiteSyncScheduler } from "./lib/sync-scheduler";

if (!process.env["SESSION_SECRET"]) {
  throw new Error(
    "SESSION_SECRET environment variable is required but was not provided. " +
    "Set it in the environment secrets before starting the server.",
  );
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Auto-seed production database if empty
  runSeedIfEmpty().catch((e) => logger.error({ err: e }, "Startup seed failed"));

  // Auto-sync sites from Google Sheets every 24 hours
  startSiteSyncScheduler();
});
