import { app } from "./app.js";
import { config } from "./lib/config.js";
import { connectRedis, redis } from "./lib/redis.js";

async function start() {
  await connectRedis();

  const server = app.listen(config.PORT, () => {
    console.log(`Server running on http://localhost:${config.PORT}`);
  });

  let isShuttingDown = false;
  const shutdown = (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    console.log(`Received ${signal}, shutting down`);

    server.close(async (error) => {
      if (error) {
        console.error("Failed to close HTTP server:", error);
        process.exitCode = 1;
      }

      if (redis.isOpen) {
        await redis.quit();
      }
    });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((error: unknown) => {
  console.error("Failed to start application:", error);
  process.exitCode = 1;
});
