import { Prisma } from "@prisma/client";
import prisma from "../config/prisma";
import ApiError from "../utils/apiError";
import { assertTransitionAllowed } from "../utils/ticketRules";
import { sendEmail } from "./emailService";

const ticketInclude = {
  createdBy: { select: { id: true, name: true, email: true, role: true } },
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
};

type AppRole = "admin" | "agent" | "user";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type TicketPriority = "low" | "medium" | "high";

type CurrentUser = {
  id: string;
  email: string;
  role: AppRole;
  department?: string | null;
};

type TicketInput = {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  imageUrl?: string;
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

const buildDepartmentTicketFilter = (
  query: TicketQueryInput,
  user: CurrentUser
): Prisma.TicketWhereInput => {
  const where: Prisma.TicketWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
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

  // For department tickets, filter by agent's department
  if (user.role === "agent" && user.department) {
    where.category = {
      equals: user.department,
      mode: Prisma.QueryMode.insensitive,
    };
  }

  return where;
};

const listTickets = async (query: TicketQueryInput, user: CurrentUser) => {
  const where = buildTicketFilter(query, user);
  const page = Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const limit = Number.isFinite(query.limit) && query.limit > 0 ? query.limit : 20;
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const departmentTickets = async (query: TicketQueryInput, user: CurrentUser) => {
  if (user.role !== "agent" && user.role !== "admin") {
    throw new ApiError(403, "Only agents and admins can view department tickets");
  }

  const where = buildDepartmentTicketFilter(query, user);
  const page = Number.isFinite(query.page) && query.page > 0 ? query.page : 1;
  const limit = Number.isFinite(query.limit) && query.limit > 0 ? query.limit : 20;
  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    data: tickets,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
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
  // Admin can assign to any agent
  // Agent can only assign to themselves
  if (user.role !== "admin" && user.role !== "agent") {
    throw new ApiError(403, "Only admin or agent can assign tickets");
  }
  
  if (user.role === "agent" && assignedToId !== user.id) {
    throw new ApiError(403, "Agents can only assign tickets to themselves");
  }

  const [ticket, agent] = await Promise.all([
    prisma.ticket.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: assignedToId } }),
  ]);

  if (!ticket) throw new ApiError(404, "Ticket not found");
  if (!agent || agent.role !== "agent") throw new ApiError(400, "Assigned user must be an agent");
  if (ticket.status === "closed") throw new ApiError(400, "Closed tickets cannot be reassigned");
  
  // Department validation: agents can only take tickets in their department
  if (user.role === "agent" && agent.department && ticket.category !== agent.department) {
    throw new ApiError(403, `Agents can only take tickets in their department (${agent.department})`);
  }

  const shouldSetReassignedAt =
    user.role === "admin" && Boolean(ticket.assignedToId) && ticket.assignedToId !== assignedToId;

  const previousAssignedToId = ticket.assignedToId;

  const shouldSetAssignedAt = !ticket.assignedToId;

  const updated = await prisma.ticket.update({
    where: { id },
    data: ({
      assignedToId,
      ...(shouldSetAssignedAt ? { assignedAt: new Date() } : {}),
      ...(shouldSetReassignedAt ? { reassignedAt: new Date() } : {}),
    } as any),
    include: ticketInclude,
  });

  console.log(`[ticket-assigned] ticket=${id} assignedTo=${assignedToId} by=${user.id}`);

  const notifyNewAssignee = sendEmail({
    to: agent.email,
    subject: `Ticket Assigned: ${updated.title}`,
    text: `Ticket: ${updated.title}\nTicket ID: ${updated.id}`,
  });

  const notifyPreviousAssignee =
    shouldSetReassignedAt && previousAssignedToId
      ? prisma.user
          .findUnique({ where: { id: previousAssignedToId }, select: { email: true } })
          .then((prev) => {
            if (!prev?.email) return;
            return sendEmail({
              to: prev.email,
              subject: `Ticket Reassigned: ${updated.title}`,
              text: `You are no longer assigned to this ticket.\n\nTicket: ${updated.title}\nTicket ID: ${updated.id}`,
            });
          })
      : Promise.resolve();

  await Promise.all([notifyNewAssignee, notifyPreviousAssignee]);

  return updated;
};

const takeTicket = async (id: string, user: CurrentUser) => {
  if (user.role !== "agent") {
    throw new ApiError(403, "Only agents can take tickets");
  }

  const [ticket, agent] = await Promise.all([
    prisma.ticket.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: user.id } }),
  ]);

  if (!ticket) throw new ApiError(404, "Ticket not found");
  if (!agent || agent.role !== "agent") throw new ApiError(400, "User must be an agent");
  if (ticket.status === "closed") throw new ApiError(400, "Closed tickets cannot be taken");
  if (ticket.assignedToId) throw new ApiError(400, "Ticket is already assigned");
  
  // Department validation: agents can only take tickets in their department
  if (agent.department && ticket.category !== agent.department) {
    throw new ApiError(403, `You can only take tickets in your department (${agent.department})`);
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: ({ assignedToId: user.id, assignedAt: new Date() } as any),
    include: ticketInclude,
  });

  console.log(`[ticket-taken] ticket=${id} takenBy=${user.id}`);

  await sendEmail({
    to: agent.email,
    subject: `Ticket Taken: ${ticket.title}`,
    text: `You have taken ticket "${ticket.title}". Current status: "${updated.status}".`,
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

  assertTransitionAllowed(ticket.status, status, user.role);

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
  departmentTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
  assignTicket,
  takeTicket,
  updateTicketStatus,
};
