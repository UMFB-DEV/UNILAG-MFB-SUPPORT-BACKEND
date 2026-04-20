import ApiError from "./apiError";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

const assertTransitionAllowed = (currentStatus: TicketStatus, nextStatus: TicketStatus): void => {
  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${currentStatus} to ${nextStatus}`
    );
  }
};

export { allowedTransitions, assertTransitionAllowed };
