import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import prisma from "../config/prisma";
import env from "../config/env";
import ApiError from "../utils/apiError";
import { sendEmail } from "./emailService";

type RegisterInput = { name: string; email: string; password: string; department?: string };
type RegisterAgentInput = { name: string; email: string; password: string; department: string };
type LoginInput = { email: string; password: string };
type ForgotPasswordInput = { email: string };
type ResetPasswordInput = { token: string; newPassword: string };
type UpdateProfileInput = { email?: string; name?: string };

const createToken = (user: { id: string; role: string; email: string }): string =>
  jwt.sign(
    { role: user.role, email: user.email },
    env.jwtSecret as Secret,
    {
      subject: user.id,
      expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
    }
  );

const register = async ({ name, email, password, department }: RegisterInput) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "Email is already in use");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "user",
      department,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, department: true, createdAt: true },
  });

  // Send welcome email
  await sendEmail({
    to: user.email,
    subject: "Welcome to Ticketing System",
    text: `Welcome ${user.name ?? user.email}! Your account has been created successfully. You can now create and manage tickets in our system.`,
  });

  return { user, token: createToken(user) };
};

const registerAgent = async ({ name, email, password, department }: RegisterAgentInput) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "Email is already in use");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "agent",
      department,
    },
    select: { id: true, name: true, email: true, role: true, isActive: true, department: true, createdAt: true },
  });

  await sendEmail({
    to: user.email,
    subject: "Welcome to Ticketing System",
    text: `Welcome ${user.name ?? user.email}! Your agent account has been created successfully.`,
  });

  return { user, token: createToken(user) };
};

const login = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.isActive === false) {
    throw new ApiError(403, "Account deactivated");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new ApiError(401, "Invalid credentials");
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    department: user.department,
    createdAt: user.createdAt,
  };

  return { user: safeUser, token: createToken(user) };
};

const forgotPassword = async ({ email }: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid user enumeration
  if (!user) {
    return { message: "If an account exists for that email, a reset link has been sent." };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + env.passwordResetTokenExpiresMinutes * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  const resetLink = `${env.frontendUrl}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your password",
    text: `You requested a password reset. Use the link below to set a new password (expires in ${env.passwordResetTokenExpiresMinutes} minutes):\n\n${resetLink}\n\nIf you did not request this, you can ignore this email.`,
  });

  return { message: "If an account exists for that email, a reset link has been sent." };
};

const resetPassword = async ({ token, newPassword }: ResetPasswordInput) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  if (record.usedAt) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  if (record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { message: "Password reset successful" };
};

const updateProfile = async (payload: UpdateProfileInput, user: { id: string; email: string }) => {
  const data: { email?: string; name?: string } = {};

  if (payload.email && payload.email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new ApiError(409, "Email is already in use");
    }
    data.email = payload.email;
  }

  if (payload.name !== undefined) {
    data.name = payload.name;
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true, department: true, createdAt: true },
  });

  return { user: updated };
};

export { register, registerAgent, login, forgotPassword, resetPassword, updateProfile };
