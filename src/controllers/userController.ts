import asyncHandler from "../utils/asyncHandler";
import * as userService from "../services/userService";

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  console.log("[listUsers] firstUserKeys=", Object.keys(users[0] || {}));
  res.json({ success: true, data: users });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, message: "User created", data: user });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(String(req.params.id), req.body);
  res.json({ success: true, message: "User updated", data: user });
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.deactivateUser(String(req.params.id));
  res.json({ success: true, message: "User deactivated", data: user });
});

const reactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.reactivateUser(String(req.params.id));
  res.json({ success: true, message: "User reactivated", data: user });
});

export { listUsers, createUser, updateUser, deactivateUser, reactivateUser };
