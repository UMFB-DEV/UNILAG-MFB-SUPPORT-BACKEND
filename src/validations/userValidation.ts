import { z } from "zod";

const roles = z.enum(["admin", "agent", "user"]);

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: roles,
  department: z.string().min(2).optional(),
});

const updateUserSchema = z
  .object({
    email: z.string().email().optional(),
    password: z.string().min(8).optional(),
    role: roles.optional(),
    department: z.string().min(2).nullable().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

export { createUserSchema, updateUserSchema };
