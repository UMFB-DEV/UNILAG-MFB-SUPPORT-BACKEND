import asyncHandler from "../utils/asyncHandler";
import * as ticketService from "../services/ticketService";
import { uploadImage } from "../config/cloudinary";
import { z } from "zod";

const createTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(3, "Description must be at least 3 characters"),
  category: z.string().min(2, "Category must be at least 2 characters"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const createTicket = asyncHandler(async (req, res) => {
  const validatedData = createTicketSchema.parse(req.body);

  let imageUrl: string | undefined;
  
  if (req.file) {
    imageUrl = await uploadImage(req.file);
  }

  const ticket = await ticketService.createTicket(
    { ...validatedData, imageUrl },
    req.user!
  );
  res.status(201).json({ success: true, message: "Ticket created", data: ticket });
});

const listTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.listTickets(req.query as any, req.user!);
  res.json({ success: true, ...result });
});

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.getTicketById(String(req.params.id), req.user!);
  res.json({ success: true, data: ticket });
});

const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicket(String(req.params.id), req.body, req.user!);
  res.json({ success: true, message: "Ticket updated", data: ticket });
});

const deleteTicket = asyncHandler(async (req, res) => {
  await ticketService.deleteTicket(String(req.params.id), req.user!);
  res.status(204).send();
});

const assignTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.assignTicket(
    String(req.params.id),
    req.body.assignedToId,
    req.user!
  );
  res.json({ success: true, message: "Ticket assigned", data: ticket });
});

const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await ticketService.updateTicketStatus(
    String(req.params.id),
    req.body.status,
    req.user!
  );
  res.json({ success: true, message: "Status updated", data: ticket });
});

const takeTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.takeTicket(String(req.params.id), req.user!);
  res.json({ success: true, message: "Ticket taken", data: ticket });
});

const departmentTickets = asyncHandler(async (req, res) => {
  const result = await ticketService.departmentTickets(req.query as any, req.user!);
  res.json({ success: true, ...result });
});

export {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  takeTicket,
  departmentTickets,
  updateTicketStatus,
};
