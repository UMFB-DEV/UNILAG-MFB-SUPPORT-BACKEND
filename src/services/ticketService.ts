import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import ApiError from "../utils/apiError";
import { assertTransitionAllowed } from "../utils/ticketRules";
import { sendEmail } from "./emailService";

const ticketInclude = {
  createdBy: { select: { id: true, email: true, role: true } },
  assignedTo: { select: { id: true, email: true, role: true } },
};

type AppRole = "admin" | "agent" | "user";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high";

type CurrentUser = {
  id: string;
  email: string;
  role: AppRole;
};

type TicketInput = {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
};

type TicketUpdateInput = Partial<TicketInput>;
type TicketQueryInput = {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: string;
  assignedTo?: string;
  createdBy?: string;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page: number;
  limit: number;
};

const ensureTicketAccess = (
  ticket: { createdById: string; assignedToId: string | null },
  user: CurrentUser
): void => {
  if (user.role === "admin") {
    return;
  }
  if (user.role === "agent") {
    if (ticket.assignedToId && ticket.assignedToId !== user.id) {
      throw new ApiError(403, "Agents can only access assigned tickets");
    }
    return;
  }
  if (ticket.createdById !== user.id) {
    throw new ApiError(403, "You can only access your own tickets");
  }
};

const createTicket = async (payload: TicketInput, currentUser: CurrentUser) => {
  const ticket = await prisma.ticket.create({
    data: {
      ...payload,
      createdById: currentUser.id,
      status: "open",
    },
    include: ticketInclude,
  });

  await sendEmail({
    to: currentUser.email,
    subject: `Ticket Created: ${ticket.title}`,
    text: `Your ticket has been created with status "${ticket.status}". Ticket ID: ${ticket.id}`,
  });

  return ticket;
};

const buildTicketFilter = (
  query: TicketQueryInput,
  user: CurrentUser
): Prisma.TicketWhereInput => {
  const where: Prisma.TicketWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.category) where.category = query.category;
  if (query.assignedTo) where.assignedToId = query.assignedTo;
  if (query.createdBy) where.createdById = query.createdBy;
  if (query.startDate || query.endDate) {
    where.createdAt = {};
    if (query.startDate) where.createdAt.gte = new Date(query.startDate);
    if (query.endDate) where.createdAt.lte = new Date(query.endDate);
  }
  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: query.keyword, mode: Prisma.QueryMode.insensitive } },
    ];
  }

  if (user.role === "user") {
    where.createdById = user.id;
  } else if (user.role === "agent") {
    where.assignedToId = user.id;
  }

  return where;
};

const listTickets = async (query: TicketQueryInput, user: CurrentUser) => {
  const where = buildTicketFilter(query, user);
  const skip = (query.page - 1) * query.limit;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: query.limit,
    }),
    prisma.ticket.count({ where }),
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

const getTicketById = async (id: string, user: CurrentUser) => {
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: ticketInclude });
  if (!ticket) throw new ApiError(404, "Ticket not found");
  ensureTicketAccess(ticket, user);
  return ticket;
};

const updateTicket = async (id: string, payload: TicketUpdateInput, user: CurrentUser) => {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new ApiError(404, "Ticket not found");
  ensureTicketAccess(ticket, user);

  if (ticket.status === "closed") {
    throw new ApiError(400, "Closed tickets cannot be edited");
  }

  if (user.role === "agent" && ticket.assignedToId !== user.id) {
    throw new ApiError(403, "Agents can only update assigned tickets");
  }

  return prisma.ticket.update({ where: { id }, data: payload, include: ticketInclude });
};

const deleteTicket = async (id: string, user: CurrentUser) => {
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) throw new ApiError(404, "Ticket not found");

  if (user.role !== "admin" && ticket.createdById !== user.id) {
    throw new ApiError(403, "Only admin or ticket owner can delete");
  }

  if (ticket.status === "closed") {
    throw new ApiError(400, "Closed tickets cannot be deleted");
  }

  await prisma.ticket.delete({ where: { id } });
};

const assignTicket = async (id: string, assignedToId: string, user: CurrentUser) => {
  if (user.role !== "admin") {
    throw new ApiError(403, "Only admin can assign tickets");
  }

  const [ticket, agent] = await Promise.all([
    prisma.ticket.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: assignedToId } }),
  ]);

  if (!ticket) throw new ApiError(404, "Ticket not found");
  if (!agent || agent.role !== "agent") throw new ApiError(400, "Assigned user must be an agent");
  if (ticket.status === "closed") throw new ApiError(400, "Closed tickets cannot be reassigned");

  const updated = await prisma.ticket.update({
    where: { id },
    data: { assignedToId },
    include: ticketInclude,
  });

  console.log(`[ticket-assigned] ticket=${id} assignedTo=${assignedToId} by=${user.id}`);

  await sendEmail({
    to: agent.email,
    subject: `Ticket Assigned: ${updated.title}`,
    text: `You have been assigned ticket ${updated.id}.`,
  });

  return updated;
};

const updateTicketStatus = async (id: string, status: TicketStatus, user: CurrentUser) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { createdBy: { select: { email: true } } },
  });
  if (!ticket) throw new ApiError(404, "Ticket not found");
  if (!["admin", "agent"].includes(user.role)) throw new ApiError(403, "Only agents/admins can change status");
  if (ticket.status === "closed") throw new ApiError(400, "Closed tickets cannot be edited");
  if (user.role === "agent" && ticket.assignedToId !== user.id) {
    throw new ApiError(403, "Agents can only manage assigned tickets");
  }
  if (status === "resolved" && user.role === "agent" && ticket.assignedToId !== user.id) {
    throw new ApiError(403, "Only assigned agent can resolve this ticket");
  }

  assertTransitionAllowed(ticket.status, status);

  const updated = await prisma.ticket.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "resolved" ? new Date() : null,
    },
    include: ticketInclude,
  });

  console.log(`[ticket-status] ticket=${id} ${ticket.status}->${status} by=${user.id}`);

  await sendEmail({
    to: ticket.createdBy.email,
    subject: `Ticket Status Updated: ${updated.title}`,
    text: `Your ticket status changed from "${ticket.status}" to "${status}".`,
  });

  return updated;
};

export {
  createTicket,
  listTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  updateTicketStatus,
};
