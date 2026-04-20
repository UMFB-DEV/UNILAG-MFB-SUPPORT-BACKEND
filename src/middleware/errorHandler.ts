import { ErrorRequestHandler } from "express";
import ApiError from "../utils/apiError";

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.issues,
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  console.error("Unhandled error:", err);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

export default errorHandler;
