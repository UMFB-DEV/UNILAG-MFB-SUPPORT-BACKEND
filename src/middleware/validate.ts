import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodTypeAny } from "zod";

type ValidationSource = "body" | "query" | "params";

const validate = (schema: ZodTypeAny, source: ValidationSource = "body"): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.parse(req[source]);
    (req as unknown as Record<string, unknown>)[source] = parsed;
    next();
  };

export default validate;
