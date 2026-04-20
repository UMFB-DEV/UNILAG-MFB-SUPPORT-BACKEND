import asyncHandler from "../utils/asyncHandler";
import { login, register } from "../services/authService";

const registerUser = asyncHandler(async (req, res) => {
  const result = await register(req.body);
  res.status(201).json({ success: true, message: "Registered successfully", data: result });
});

const loginUser = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  res.json({ success: true, message: "Logged in successfully", data: result });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

export { registerUser, loginUser, me };
