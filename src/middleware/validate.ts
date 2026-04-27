import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodTypeAny } from "zod";

type ValidationSource = "body" | "query" | "params";

const validate = (schema: ZodTypeAny, source: ValidationSource = "body"): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req[source]);
    if (source === "body") {
      (req as unknown as Record<string, unknown>)[source] = parsed;
      next();
      return;
    }

    const target = (req as unknown as Record<string, unknown>)[source];
    if (target && typeof target === "object" && parsed && typeof parsed === "object") {
      Object.assign(target as Record<string, unknown>, parsed as Record<string, unknown>);
      next();
      return;
    }

    (req as unknown as Record<string, unknown>)[source] = parsed;
    next();
  };

export default validate;
