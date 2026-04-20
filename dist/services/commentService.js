"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listComments = exports.createComment = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const apiError_1 = __importDefault(require("../utils/apiError"));
const emailService_1 = require("./emailService");
const createComment = async (ticketId, payload, user) => {
    const ticket = await prisma_1.default.ticket.findUnique({
        where: { id: ticketId },
        include: {
            createdBy: { select: { id: true, email: true } },
            assignedTo: { select: { id: true, email: true } },
        },
    });
    if (!ticket)
        throw new apiError_1.default(404, "Ticket not found");
    if (ticket.status === "closed") {
        throw new apiError_1.default(400, "Cannot comment on closed tickets");
    }
    if (user.role === "user" && ticket.createdById !== user.id) {
        throw new apiError_1.default(403, "You can only comment on your own tickets");
    }
    if (user.role === "agent" && ticket.assignedToId !== user.id) {
        throw new apiError_1.default(403, "Agents can only comment on assigned tickets");
    }
    if (payload.isInternal && user.role === "user") {
        throw new apiError_1.default(403, "End users cannot create internal comments");
    }
    const comment = await prisma_1.default.comment.create({
        data: {
            ticketId,
            userId: user.id,
            message: payload.message,
            isInternal: Boolean(payload.isInternal),
        },
        include: {
            user: { select: { id: true, email: true, role: true } },
        },
    });
    if (!comment.isInternal) {
        const targets = new Set();
        if (ticket.createdById !== user.id)
            targets.add(ticket.createdBy.email);
        if (ticket.assignedTo && ticket.assignedTo.id !== user.id)
            targets.add(ticket.assignedTo.email);
        await Promise.all(Array.from(targets).map((email) => (0, emailService_1.sendEmail)({
            to: email,
            subject: `New Comment on Ticket: ${ticket.title}`,
            text: `A new public comment was added: ${comment.message}`,
        })));
    }
    return comment;
};
exports.createComment = createComment;
const listComments = async (ticketId, user) => {
    const ticket = await prisma_1.default.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket)
        throw new apiError_1.default(404, "Ticket not found");
    if (user.role === "user" && ticket.createdById !== user.id) {
        throw new apiError_1.default(403, "You can only view comments on your own tickets");
    }
    if (user.role === "agent" && ticket.assignedToId !== user.id) {
        throw new apiError_1.default(403, "Agents can only view comments on assigned tickets");
    }
    const where = {
        ticketId,
        ...(user.role === "user" ? { isInternal: false } : {}),
    };
    return prisma_1.default.comment.findMany({
        where,
        include: {
            user: { select: { id: true, email: true, role: true } },
        },
        orderBy: { createdAt: "asc" },
    });
};
exports.listComments = listComments;
