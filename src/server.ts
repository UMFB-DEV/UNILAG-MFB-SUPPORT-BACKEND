import app from "./app";
import env from "./config/env";
import prisma from "./config/prisma";

const startServer = async (): Promise<void> => {
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

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

void startServer();
