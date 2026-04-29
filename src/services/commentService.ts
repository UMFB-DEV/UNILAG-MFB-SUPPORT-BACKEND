import prisma from "../config/prisma";
import ApiError from "../utils/apiError";
import { sendEmail } from "./emailService";

type AppRole = "admin" | "agent" | "user";
type CurrentUser = { id: string; role: AppRole };

type CommentInput = {
  message: string;
  isInternal?: boolean;
};

const createComment = async (ticketId: string, payload: CommentInput, user: CurrentUser) => {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      createdBy: { select: { id: true, email: true } },
      assignedTo: { select: { id: true, email: true } },
    },
  });
  if (!ticket) throw new ApiError(404, "Ticket not found");

  if (ticket.status === "closed") {
    throw new ApiError(400, "Cannot comment on closed tickets");
  }

  if (user.role === "user" && ticket.createdById !== user.id) {
    throw new ApiError(403, "You can only comment on your own tickets");
  }
  if (user.role === "agent" && ticket.assignedToId !== user.id) {
    throw new ApiError(403, "Agents can only comment on assigned tickets");
  }
  if (payload.isInternal && user.role === "user") {
    throw new ApiError(403, "End users cannot create internal comments");
  }

  const comment = await prisma.comment.create({
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
    const targets = new Set<string>();
    if (ticket.createdById !== user.id) targets.add(ticket.createdBy.email);
    if (ticket.assignedTo && ticket.assignedTo.id !== user.id) targets.add(ticket.assignedTo.email);
    await Promise.all(
      Array.from(targets).map((email) =>
        sendEmail({
          to: email,
          subject: `New Comment on Ticket: ${ticket.title}`,
          text: `Ticket: ${ticket.title}\n\nA new public comment was added: ${comment.message}`,
        })
      )
    );
  }

  return comment;
};

const listComments = async (ticketId: string, user: CurrentUser) => {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new ApiError(404, "Ticket not found");

  if (user.role === "user" && ticket.createdById !== user.id) {
    throw new ApiError(403, "You can only view comments on your own tickets");
  }
  if (user.role === "agent" && ticket.assignedToId !== user.id) {
    throw new ApiError(403, "Agents can only view comments on assigned tickets");
  }

  const where = {
    ticketId,
    ...(user.role === "user" ? { isInternal: false } : {}),
  };

  return prisma.comment.findMany({
    where,
    include: {
      user: { select: { id: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};

export { createComment, listComments };
