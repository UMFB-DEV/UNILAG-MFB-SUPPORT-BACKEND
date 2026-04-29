import express from "express";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import reportRoutes from "./routes/reportRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import userRoutes from "./routes/userRoutes";
import { authenticate } from "./middleware/authMiddleware";
import errorHandler from "./middleware/errorHandler";
import env from "./config/env";

const app = express();

app.disable("etag");
app.set("etag", false);

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// CORS configuration
app.use(cors({
  origin: [env.frontendUrl, "http://localhost:3000"],
  credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Ticketing API is running" });
});

app.get("/departments", (req, res) => {
  res.json({
    success: true,
    data: [
      "Internal control and risk department",
      "Credit department",
      "Compliance",
      "Human resources department",
      "It department",
      "Marketing",
      "Operations",
    ],
  });
});

app.use("/auth", authRoutes);
app.use("/users", authenticate, userRoutes);
app.use("/tickets", authenticate, ticketRoutes);
app.use("/reports", authenticate, reportRoutes);

app.use(errorHandler);

export default app;
