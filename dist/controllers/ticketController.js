"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketStatus = exports.assignTicket = exports.deleteTicket = exports.updateTicket = exports.getTicket = exports.listTickets = exports.createTicket = void 0;
const asyncHandler_1 = __importDefault(require("../utils/asyncHandler"));
const ticketService = __importStar(require("../services/ticketService"));
const createTicket = (0, asyncHandler_1.default)(async (req, res) => {
    const ticket = await ticketService.createTicket(req.body, req.user);
    res.status(201).json({ success: true, message: "Ticket created", data: ticket });
});
exports.createTicket = createTicket;
const listTickets = (0, asyncHandler_1.default)(async (req, res) => {
    const result = await ticketService.listTickets(req.query, req.user);
    res.json({ success: true, ...result });
});
exports.listTickets = listTickets;
const getTicket = (0, asyncHandler_1.default)(async (req, res) => {
    const ticket = await ticketService.getTicketById(String(req.params.id), req.user);
    res.json({ success: true, data: ticket });
});
exports.getTicket = getTicket;
const updateTicket = (0, asyncHandler_1.default)(async (req, res) => {
    const ticket = await ticketService.updateTicket(String(req.params.id), req.body, req.user);
    res.json({ success: true, message: "Ticket updated", data: ticket });
});
exports.updateTicket = updateTicket;
const deleteTicket = (0, asyncHandler_1.default)(async (req, res) => {
    await ticketService.deleteTicket(String(req.params.id), req.user);
    res.status(204).send();
});
exports.deleteTicket = deleteTicket;
const assignTicket = (0, asyncHandler_1.default)(async (req, res) => {
    const ticket = await ticketService.assignTicket(String(req.params.id), req.body.assignedToId, req.user);
    res.json({ success: true, message: "Ticket assigned", data: ticket });
});
exports.assignTicket = assignTicket;
const updateTicketStatus = (0, asyncHandler_1.default)(async (req, res) => {
    const ticket = await ticketService.updateTicketStatus(String(req.params.id), req.body.status, req.user);
    res.json({ success: true, message: "Status updated", data: ticket });
});
exports.updateTicketStatus = updateTicketStatus;
