import { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

const asyncHandler = (fn: AsyncController): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
