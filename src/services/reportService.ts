import { stringify } from "csv-stringify/sync";
import prisma from "../config/prisma";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = 2, delayMs = 300): Promise<T> => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const code = (err as any)?.code;
      if (code !== "P1001" || attempt === retries) {
        throw err;
      }
      await sleep(delayMs * Math.pow(2, attempt));
    }
  }
  throw lastError;
};

type SummaryQuery = {
  range?: "today" | "week" | "month";
  startDate?: string;
  endDate?: string;
};

const getDateRange = (query?: SummaryQuery): { start?: Date; end?: Date } => {
  if (!query) return {};

  if (query.startDate || query.endDate) {
    const start = query.startDate ? new Date(query.startDate) : undefined;
    const end = query.endDate ? new Date(query.endDate) : undefined;
    return {
      start: start && !Number.isNaN(start.getTime()) ? start : undefined,
      end: end && !Number.isNaN(end.getTime()) ? end : undefined,
    };
  }

  if (!query.range) return {};

  const now = new Date();

  if (query.range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (query.range === "week") {
    const end = new Date(now);
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start, end };
  }

  const end = new Date(now);
  const start = new Date(now);
  start.setMonth(start.getMonth() - 1);
  return { start, end };
};

const getSummary = async (query?: SummaryQuery) => {
  const { start, end } = getDateRange(query);
  const createdAtFilter =
    start || end
      ? {
          createdAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        }
      : {};

  const resolvedAtFilter =
    start || end
      ? {
          resolvedAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        }
      : {};

  const [totalTickets, openTickets, closedTickets, resolvedTickets, ticketsPerAgent] =
    await withRetry(() =>
      Promise.all([
        prisma.ticket.count({ where: { ...createdAtFilter } }),
        prisma.ticket.count({ where: { status: { in: ["open", "in_progress"] }, ...createdAtFilter } }),
        prisma.ticket.count({ where: { status: "closed", ...createdAtFilter } }),
        prisma.ticket.findMany({
          where: {
            status: { in: ["resolved", "closed"] },
            resolvedAt: { not: null },
            ...resolvedAtFilter,
          },
          select: { createdAt: true, resolvedAt: true },
        }),
        prisma.ticket.groupBy({
          by: ["assignedToId"],
          _count: { _all: true },
          where: { assignedToId: { not: null }, ...createdAtFilter },
        }),
      ])
    );

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
    ? await withRetry(() =>
        prisma.user.findMany({
          where: { id: { in: agentIds } },
          select: { id: true, email: true },
        })
      )
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
    averageResolutionMinutes: Number((avgResolutionMs / (1000 * 60)).toFixed(2)),
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
    ["averageResolutionMinutes", summary.averageResolutionMinutes],
    ...summary.ticketsPerAgent.map((agent) => [
      `ticketsPerAgent:${agent.agentEmail || agent.agentId}`,
      agent.ticketCount,
    ]),
  ];

  return stringify(rows);
};

export { getSummary, exportSummaryCsv };
