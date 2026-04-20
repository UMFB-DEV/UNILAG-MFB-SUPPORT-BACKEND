import { NextFunction, Request, RequestHandler, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import prisma from "../config/prisma";
import env from "../config/env";
import ApiError from "../utils/apiError";

const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token is missing");
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
    if (!payload.sub || typeof payload.sub !== "string") {
      throw new ApiError(401, "Invalid token subject");
    }
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, department: true },
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired token");
  }
};

const authorize =
  (...roles: Array<"admin" | "agent" | "user">): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden");
    }
    next();
  };

export { authenticate, authorize };
