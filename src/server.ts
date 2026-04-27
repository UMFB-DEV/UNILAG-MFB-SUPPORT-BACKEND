import app from "./app";
import env from "./config/env";
import prisma from "./config/prisma";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const connectToDatabaseWithRetry = async (retries = 10): Promise<void> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      try {
        const rawUrl = process.env.DATABASE_URL;
        if (rawUrl) {
          const url = new URL(rawUrl);
          console.log(`Connecting to database at ${url.hostname}:${url.port || "5432"}`);
        } else {
          console.log("Connecting to database (DATABASE_URL not set)");
        }
      } catch {
        console.log("Connecting to database");
      }

      await prisma.$connect();
      await prisma.user.count();
      console.log("Database connection successful");
      return;
    } catch (error) {
      console.error(`Database connection failed (attempt ${attempt + 1}/${retries + 1}):`, error);
      await sleep(1000 * Math.min(attempt + 1, 10));
    }
  }
};

const startServer = async (): Promise<void> => {
  try {
    app.listen(env.port, "0.0.0.0", () => {
      console.log(`Server running on port ${env.port}`);
    });

    void connectToDatabaseWithRetry();
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
