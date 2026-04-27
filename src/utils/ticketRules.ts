import ApiError from "./apiError";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type AppRole = "admin" | "agent" | "user";

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  open: ["in_progress"],
  in_progress: ["resolved"],
  resolved: ["closed"],
  closed: [],
};

const assertTransitionAllowed = (
  currentStatus: TicketStatus,
  nextStatus: TicketStatus,
  userRole?: AppRole
): void => {
  const allowed = allowedTransitions[currentStatus] || [];

  // Allow admins to revert in_progress -> open
  if (currentStatus === "in_progress" && nextStatus === "open" && userRole === "admin") {
    return;
  }

  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      400,
      `Invalid status transition from ${currentStatus} to ${nextStatus}`
    );
  }
};

export { allowedTransitions, assertTransitionAllowed };
