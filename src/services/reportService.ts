import { stringify } from "csv-stringify/sync";
import prisma from "../config/prisma";

const getSummary = async () => {
  const [totalTickets, openTickets, closedTickets, resolvedTickets, ticketsPerAgent] =
    await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: { in: ["open", "in_progress"] } } }),
      prisma.ticket.count({ where: { status: "closed" } }),
      prisma.ticket.findMany({
        where: { status: { in: ["resolved", "closed"] }, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true },
      }),
      prisma.ticket.groupBy({
        by: ["assignedToId"],
        _count: { _all: true },
        where: { assignedToId: { not: null } },
      }),
    ]);

  const avgResolutionMs =
    resolvedTickets.length === 0
      ? 0
      : Math.round(
          resolvedTickets.reduce(
            (acc, ticket) => acc + ((ticket.resolvedAt as Date).getTime() - ticket.createdAt.getTime()),
            0
          ) / resolvedTickets.length
        );

  const agentIds = ticketsPerAgent
    .filter((x) => x.assignedToId)
    .map((x) => x.assignedToId as string);
  const agents = agentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: agentIds } },
        select: { id: true, email: true },
      })
    : [];

  const ticketCountByAgent = ticketsPerAgent.map((entry) => ({
    agentId: entry.assignedToId,
    agentEmail: agents.find((a) => a.id === entry.assignedToId)?.email || null,
    ticketCount: entry._count._all,
  }));

  return {
    totalTickets,
    openTickets,
    closedTickets,
    averageResolutionHours: Number((avgResolutionMs / (1000 * 60 * 60)).toFixed(2)),
    ticketsPerAgent: ticketCountByAgent,
  };
};

const exportSummaryCsv = async () => {
  const summary = await getSummary();
  const rows = [
    ["metric", "value"],
    ["totalTickets", summary.totalTickets],
    ["openTickets", summary.openTickets],
    ["closedTickets", summary.closedTickets],
    ["averageResolutionHours", summary.averageResolutionHours],
    ...summary.ticketsPerAgent.map((agent) => [
      `ticketsPerAgent:${agent.agentEmail || agent.agentId}`,
      agent.ticketCount,
    ]),
  ];

  return stringify(rows);
};

export { getSummary, exportSummaryCsv };
