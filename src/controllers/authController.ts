import asyncHandler from "../utils/asyncHandler";
import { forgotPassword, login, register, registerAgent, resetPassword, updateProfile } from "../services/authService";

const registerUser = asyncHandler(async (req, res) => {
  const result = await register(req.body);
  res.status(201).json({ success: true, message: "Registered successfully", data: result });
});

const registerAgentUser = asyncHandler(async (req, res) => {
  const result = await registerAgent(req.body);
  res.status(201).json({ success: true, message: "Registered successfully", data: result });
});

const loginUser = asyncHandler(async (req, res) => {
  const result = await login(req.body);
  res.json({ success: true, message: "Logged in successfully", data: result });
});

const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

const forgotPasswordUser = asyncHandler(async (req, res) => {
  const result = await forgotPassword(req.body);
  res.json({ success: true, message: result.message });
});

const resetPasswordUser = asyncHandler(async (req, res) => {
  const result = await resetPassword(req.body);
  res.json({ success: true, message: result.message });
});

const updateProfileUser = asyncHandler(async (req, res) => {
  const result = await updateProfile(req.body, req.user!);
  res.json({ success: true, message: "Profile updated", data: result });
});

export { registerUser, registerAgentUser, loginUser, me, forgotPasswordUser, resetPasswordUser, updateProfileUser };
