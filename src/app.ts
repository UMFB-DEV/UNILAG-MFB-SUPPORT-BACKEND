import express from "express";
import morgan from "morgan";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import reportRoutes from "./routes/reportRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import userRoutes from "./routes/userRoutes";
import { authenticate } from "./middleware/authMiddleware";
import errorHandler from "./middleware/errorHandler";

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
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
