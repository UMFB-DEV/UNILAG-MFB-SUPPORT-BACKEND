import { z } from "zod";

const priorities = z.enum(["low", "medium", "high"]);
const statuses = z.enum(["open", "in_progress", "resolved", "closed"]);

const createTicketSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
  category: z.string().min(2),
  priority: priorities.default("medium"),
});

const updateTicketSchema = z
  .object({
    title: z.string().min(3).optional(),
    description: z.string().min(3).optional(),
    category: z.string().min(2).optional(),
    priority: priorities.optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
  });

const assignTicketSchema = z.object({
  assignedToId: z.string().uuid(),
});

const updateStatusSchema = z.object({
  status: statuses,
});

const ticketQuerySchema = z.object({
  status: statuses.optional(),
  priority: priorities.optional(),
  category: z.string().optional(),
  assignedTo: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  keyword: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  updateStatusSchema,
  ticketQuerySchema,
};
