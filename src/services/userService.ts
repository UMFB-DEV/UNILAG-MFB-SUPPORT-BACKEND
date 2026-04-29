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
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
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
    select: { id: true, email: true, role: true, department: true, createdAt: true },
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
    select: { id: true, email: true, role: true, department: true, createdAt: true },
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

export { listUsers, createUser, updateUser, deleteUser };
