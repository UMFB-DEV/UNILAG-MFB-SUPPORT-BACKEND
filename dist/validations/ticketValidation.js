"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ticketQuerySchema = exports.updateStatusSchema = exports.assignTicketSchema = exports.updateTicketSchema = exports.createTicketSchema = void 0;
const zod_1 = require("zod");
const priorities = zod_1.z.enum(["low", "medium", "high"]);
const statuses = zod_1.z.enum(["open", "in_progress", "resolved", "closed"]);
const createTicketSchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(3),
    category: zod_1.z.string().min(2),
    priority: priorities.default("medium"),
});
exports.createTicketSchema = createTicketSchema;
const updateTicketSchema = zod_1.z
    .object({
    title: zod_1.z.string().min(3).optional(),
    description: zod_1.z.string().min(3).optional(),
    category: zod_1.z.string().min(2).optional(),
    priority: priorities.optional(),
})
    .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field is required",
});
exports.updateTicketSchema = updateTicketSchema;
const assignTicketSchema = zod_1.z.object({
    assignedToId: zod_1.z.string().uuid(),
});
exports.assignTicketSchema = assignTicketSchema;
const updateStatusSchema = zod_1.z.object({
    status: statuses,
});
exports.updateStatusSchema = updateStatusSchema;
const ticketQuerySchema = zod_1.z.object({
    status: statuses.optional(),
    priority: priorities.optional(),
    category: zod_1.z.string().optional(),
    assignedTo: zod_1.z.string().uuid().optional(),
    createdBy: zod_1.z.string().uuid().optional(),
    startDate: zod_1.z.iso.datetime().optional(),
    endDate: zod_1.z.iso.datetime().optional(),
    keyword: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
});
exports.ticketQuerySchema = ticketQuerySchema;
