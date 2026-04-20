import express from "express";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes";
import reportRoutes from "./routes/reportRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import userRoutes from "./routes/userRoutes";
import { authenticate } from "./middleware/authMiddleware";
import errorHandler from "./middleware/errorHandler";

const app = express();

app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Ticketing API is running" });
});

app.use("/auth", authRoutes);
app.use("/users", authenticate, userRoutes);
app.use("/tickets", authenticate, ticketRoutes);
app.use("/reports", authenticate, reportRoutes);

app.use(errorHandler);

export default app;
