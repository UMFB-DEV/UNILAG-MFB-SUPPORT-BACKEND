import "express";

type AppUserRole = "admin" | "agent" | "user";

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      role: AppUserRole;
      department: string | null;
    }

    interface Request {
      user?: UserPayload;
    }
  }
}

export {};
