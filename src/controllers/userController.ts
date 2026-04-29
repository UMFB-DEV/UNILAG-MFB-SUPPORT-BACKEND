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

const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(String(req.params.id));
  res.status(204).send();
});

export { listUsers, createUser, updateUser, deleteUser };
