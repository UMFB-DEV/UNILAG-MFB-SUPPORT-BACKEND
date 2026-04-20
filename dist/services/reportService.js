"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportSummaryCsv = exports.getSummary = void 0;
const sync_1 = require("csv-stringify/sync");
const prisma_1 = __importDefault(require("../config/prisma"));
const getSummary = async () => {
    const [totalTickets, openTickets, closedTickets, resolvedTickets, ticketsPerAgent] = await Promise.all([
        prisma_1.default.ticket.count(),
        prisma_1.default.ticket.count({ where: { status: { in: ["open", "in_progress"] } } }),
        prisma_1.default.ticket.count({ where: { status: "closed" } }),
        prisma_1.default.ticket.findMany({
            where: { status: { in: ["resolved", "closed"] }, resolvedAt: { not: null } },
            select: { createdAt: true, resolvedAt: true },
        }),
        prisma_1.default.ticket.groupBy({
            by: ["assignedToId"],
            _count: { _all: true },
            where: { assignedToId: { not: null } },
        }),
    ]);
    const avgResolutionMs = resolvedTickets.length === 0
        ? 0
        : Math.round(resolvedTickets.reduce((acc, ticket) => acc + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()), 0) / resolvedTickets.length);
    const agentIds = ticketsPerAgent
        .filter((x) => x.assignedToId)
        .map((x) => x.assignedToId);
    const agents = agentIds.length
        ? await prisma_1.default.user.findMany({
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
exports.getSummary = getSummary;
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
    return (0, sync_1.stringify)(rows);
};
exports.exportSummaryCsv = exportSummaryCsv;
