import bcrypt from "bcrypt";
import jwt, { Secret, SignOptions } from "jsonwebtoken";
import prisma from "../config/prisma";
import env from "../config/env";
import ApiError from "../utils/apiError";

type AuthInput = { email: string; password: string; department?: string };

const createToken = (user: { id: string; role: string; email: string }): string =>
  jwt.sign(
    { role: user.role, email: user.email },
    env.jwtSecret as Secret,
    {
      subject: user.id,
      expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"],
    }
  );

const register = async ({ email, password, department }: AuthInput) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "Email is already in use");
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      role: "user",
      department,
    },
    select: { id: true, email: true, role: true, department: true, createdAt: true },
  });

  return { user, token: createToken(user) };
};

const login = async ({ email, password }: AuthInput) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new ApiError(401, "Invalid credentials");
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    department: user.department,
    createdAt: user.createdAt,
  };

  return { user: safeUser, token: createToken(user) };
};

export { register, login };
