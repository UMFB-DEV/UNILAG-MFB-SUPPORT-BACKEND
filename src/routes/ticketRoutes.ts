import express from "express";
import * as commentController from "../controllers/commentController";
import * as ticketController from "../controllers/ticketController";
import validate from "../middleware/validate";
import {
  createTicketSchema,
  updateTicketSchema,
  assignTicketSchema,
  updateStatusSchema,
  ticketQuerySchema,
} from "../validations/ticketValidation";
import { createCommentSchema } from "../validations/commentValidation";
import { upload } from "../config/multer";

const router = express.Router();

router.post("/", upload.single("image"), ticketController.createTicket);
router.get("/", validate(ticketQuerySchema, "query"), ticketController.listTickets);
router.get("/department", validate(ticketQuerySchema, "query"), ticketController.departmentTickets);
router.get("/:id", ticketController.getTicket);
router.patch("/:id", validate(updateTicketSchema), ticketController.updateTicket);
router.delete("/:id", ticketController.deleteTicket);
router.patch("/:id/assign", validate(assignTicketSchema), ticketController.assignTicket);
router.patch("/:id/take", ticketController.takeTicket);
router.patch("/:id/status", validate(updateStatusSchema), ticketController.updateTicketStatus);

router.post("/:id/comments", validate(createCommentSchema), commentController.createComment);
router.get("/:id/comments", commentController.listComments);

export default router;
