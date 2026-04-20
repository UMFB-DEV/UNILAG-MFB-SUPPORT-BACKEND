import asyncHandler from "../utils/asyncHandler";
import * as ticketService from "../services/ticketService";

const createTicket = asyncHandler(async (req, res) => {
  const ticket = await ticketService.createTicket(req.body, req.user!);
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

export {
  createTicket,
  listTickets,
  getTicket,
  updateTicket,
  deleteTicket,
  assignTicket,
  updateTicketStatus,
};
