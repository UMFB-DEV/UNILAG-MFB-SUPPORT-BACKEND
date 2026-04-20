"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketStatus = exports.assignTicket = exports.deleteTicket = exports.updateTicket = exports.getTicketById = exports.listTickets = exports.createTicket = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../config/prisma"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const ticketRules_1 = require("../utils/ticketRules");
const emailService_1 = require("./emailService");
const ticketInclude = {
    createdBy: { select: { id: true, email: true, role: true } },
    assignedTo: { select: { id: true, email: true, role: true } },
};
const ensureTicketAccess = (ticket, user) => {
    if (user.role === "admin") {
        return;
    }
    if (user.role === "agent") {
        if (ticket.assignedToId && ticket.assignedToId !== user.id) {
            throw new apiError_1.default(403, "Agents can only access assigned tickets");
        }
        return;
    }
    if (ticket.createdById !== user.id) {
        throw new apiError_1.default(403, "You can only access your own tickets");
    }
};
const createTicket = async (payload, currentUser) => {
    const ticket = await prisma_1.default.ticket.create({
        data: {
            ...payload,
            createdById: currentUser.id,
            status: "open",
        },
        include: ticketInclude,
    });
    await (0, emailService_1.sendEmail)({
        to: currentUser.email,
        subject: `Ticket Created: ${ticket.title}`,
        text: `Your ticket has been created with status "${ticket.status}". Ticket ID: ${ticket.id}`,
    });
    return ticket;
};
exports.createTicket = createTicket;
const buildTicketFilter = (query, user) => {
    const where = {};
    if (query.status)
        where.status = query.status;
    if (query.priority)
        where.priority = query.priority;
    if (query.category)
        where.category = query.category;
    if (query.assignedTo)
        where.assignedToId = query.assignedTo;
    if (query.createdBy)
        where.createdById = query.createdBy;
    if (query.startDate || query.endDate) {
        where.createdAt = {};
        if (query.startDate)
            where.createdAt.gte = new Date(query.startDate);
        if (query.endDate)
            where.createdAt.lte = new Date(query.endDate);
    }
    if (query.keyword) {
        where.OR = [
            { title: { contains: query.keyword, mode: client_1.Prisma.QueryMode.insensitive } },
            { description: { contains: query.keyword, mode: client_1.Prisma.QueryMode.insensitive } },
        ];
    }
    if (user.role === "user") {
        where.createdById = user.id;
    }
    else if (user.role === "agent") {
        where.assignedToId = user.id;
    }
    return where;
};
const listTickets = async (query, user) => {
    const where = buildTicketFilter(query, user);
    const skip = (query.page - 1) * query.limit;
    const [tickets, total] = await Promise.all([
        prisma_1.default.ticket.findMany({
            where,
            include: ticketInclude,
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
            skip,
            take: query.limit,
        }),
        prisma_1.default.ticket.count({ where }),
    ]);
    return {
        data: tickets,
        meta: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
};
exports.listTickets = listTickets;
const getTicketById = async (id, user) => {
    const ticket = await prisma_1.default.ticket.findUnique({ where: { id }, include: ticketInclude });
    if (!ticket)
        throw new apiError_1.default(404, "Ticket not found");
    ensureTicketAccess(ticket, user);
    return ticket;
};
exports.getTicketById = getTicketById;
const updateTicket = async (id, payload, user) => {
    const ticket = await prisma_1.default.ticket.findUnique({ where: { id } });
    if (!ticket)
        throw new apiError_1.default(404, "Ticket not found");
    ensureTicketAccess(ticket, user);
    if (ticket.status === "closed") {
        throw new apiError_1.default(400, "Closed tickets cannot be edited");
    }
    if (user.role === "agent" && ticket.assignedToId !== user.id) {
        throw new apiError_1.default(403, "Agents can only update assigned tickets");
    }
    return prisma_1.default.ticket.update({ where: { id }, data: payload, include: ticketInclude });
};
exports.updateTicket = updateTicket;
const deleteTicket = async (id, user) => {
    const ticket = await prisma_1.default.ticket.findUnique({ where: { id } });
    if (!ticket)
        throw new apiError_1.default(404, "Ticket not found");
    if (user.role !== "admin" && ticket.createdById !== user.id) {
        throw new apiError_1.default(403, "Only admin or ticket owner can delete");
    }
    if (ticket.status === "closed") {
        throw new apiError_1.default(400, "Closed tickets cannot be deleted");
    }
    await prisma_1.default.ticket.delete({ where: { id } });
};
exports.deleteTicket = deleteTicket;
const assignTicket = async (id, assignedToId, user) => {
    if (user.role !== "admin") {
        throw new apiError_1.default(403, "Only admin can assign tickets");
    }
    const [ticket, agent] = await Promise.all([
        prisma_1.default.ticket.findUnique({ where: { id } }),
        prisma_1.default.user.findUnique({ where: { id: assignedToId } }),
    ]);
    if (!ticket)
        throw new apiError_1.default(404, "Ticket not found");
    if (!agent || agent.role !== "agent")
        throw new apiError_1.default(400, "Assigned user must be an agent");
    if (ticket.status === "closed")
        throw new apiError_1.default(400, "Closed tickets cannot be reassigned");
    const updated = await prisma_1.default.ticket.update({
        where: { id },
        data: { assignedToId },
        include: ticketInclude,
    });
    console.log(`[ticket-assigned] ticket=${id} assignedTo=${assignedToId} by=${user.id}`);
    await (0, emailService_1.sendEmail)({
        to: agent.email,
        subject: `Ticket Assigned: ${updated.title}`,
        text: `You have been assigned ticket ${updated.id}.`,
    });
    return updated;
};
exports.assignTicket = assignTicket;
const updateTicketStatus = async (id, status, user) => {
    const ticket = await prisma_1.default.ticket.findUnique({
        where: { id },
        include: { createdBy: { select: { email: true } } },
    });
    if (!ticket)
        throw new apiError_1.default(404, "Ticket not found");
    if (!["admin", "agent"].includes(user.role))
        throw new apiError_1.default(403, "Only agents/admins can change status");
    if (ticket.status === "closed")
        throw new apiError_1.default(400, "Closed tickets cannot be edited");
    if (user.role === "agent" && ticket.assignedToId !== user.id) {
        throw new apiError_1.default(403, "Agents can only manage assigned tickets");
    }
    if (status === "resolved" && user.role === "agent" && ticket.assignedToId !== user.id) {
        throw new apiError_1.default(403, "Only assigned agent can resolve this ticket");
    }
    (0, ticketRules_1.assertTransitionAllowed)(ticket.status, status);
    const updated = await prisma_1.default.ticket.update({
        where: { id },
        data: {
            status,
            resolvedAt: status === "resolved" ? new Date() : null,
        },
        include: ticketInclude,
    });
    console.log(`[ticket-status] ticket=${id} ${ticket.status}->${status} by=${user.id}`);
    await (0, emailService_1.sendEmail)({
        to: ticket.createdBy.email,
        subject: `Ticket Status Updated: ${updated.title}`,
        text: `Your ticket status changed from "${ticket.status}" to "${status}".`,
    });
    return updated;
};
exports.updateTicketStatus = updateTicketStatus;
