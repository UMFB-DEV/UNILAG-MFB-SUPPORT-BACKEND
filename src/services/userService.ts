import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import ApiError from "../utils/apiError";

type CreateUserInput = {
  email: string;
  password: string;
  role: "admin" | "agent" | "user";
  department?: string;
};

type UpdateUserInput = {
  email?: string;
  password?: string;
  role?: "admin" | "agent" | "user";
  department?: string | null;
};

const listUsers = async () => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      department: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const agentIds = users.filter((u) => u.role === "agent").map((u) => u.id);
  if (agentIds.length === 0) {
    return users;
  }

  const resolvedTickets = await prisma.ticket.findMany({
    where: {
      status: { in: ["resolved", "closed"] },
      resolvedAt: { not: null },
      assignedToId: { in: agentIds },
    },
    select: {
      assignedToId: true,
      assignedAt: true,
      reassignedAt: true,
      resolvedAt: true,
    },
  });

  const agentBuckets = resolvedTickets.reduce(
    (acc, t) => {
      const agentId = t.assignedToId as string;
      const startAt = t.reassignedAt || t.assignedAt;
      if (!startAt || !t.resolvedAt) return acc;

      const durationMs = (t.resolvedAt as Date).getTime() - (startAt as Date).getTime();
      if (!Number.isFinite(durationMs) || durationMs < 0) return acc;

      const bucket = acc[agentId] || { sumMs: 0, count: 0 };
      bucket.sumMs += durationMs;
      bucket.count += 1;
      acc[agentId] = bucket;
      return acc;
    },
    {} as Record<string, { sumMs: number; count: number }>
  );

  return users.map((u) => {
    if (u.role !== "agent") return u;
    const bucket = agentBuckets[u.id];
    const avgMinutes =
      bucket && bucket.count > 0
        ? Number(((bucket.sumMs / bucket.count) / (1000 * 60)).toFixed(2))
        : 0;
    return { ...u, averageAssignedToResolvedMinutes: avgMinutes };
  });
};

const createUser = async ({ email, password, role, department }: CreateUserInput) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "Email is already in use");
  }
  const hashed = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: { email, password: hashed, role, department },
    select: { id: true, email: true, role: true, isActive: true, department: true, createdAt: true },
  });
};

const updateUser = async (id: string, payload: UpdateUserInput) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  const data = { ...payload };
  if (payload.password) {
    data.password = await bcrypt.hash(payload.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, email: true, role: true, isActive: true, department: true, createdAt: true },
  });
};

const deactivateUser = async (id: string) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, email: true, role: true, isActive: true, department: true, createdAt: true },
  });
};

const reactivateUser = async (id: string) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: true },
    select: { id: true, name: true, email: true, role: true, isActive: true, department: true, createdAt: true },
  });
};

const deleteUser = async (id: string) => {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "User not found");
  }

  const createdTicketCount = await prisma.ticket.count({ where: { createdById: id } });
  if (createdTicketCount > 0) {
    throw new ApiError(
      409,
      "Cannot delete user because they have created tickets. Reassign/delete the user's tickets first."
    );
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { userId: id } }),
    prisma.passwordResetToken.deleteMany({ where: { userId: id } }),
    prisma.ticket.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } }),
    prisma.user.delete({ where: { id } }),
  ]);
};

export { listUsers, createUser, updateUser, deactivateUser, reactivateUser, deleteUser };
