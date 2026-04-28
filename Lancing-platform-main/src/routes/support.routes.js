import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { createTicket, getUserTickets } from "../controllers/admin/admin.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createTicketSchema } from "../validations/support.validation.js";

const router = express.Router();

router.use(authMiddleware);

// User support routes
router.post("/tickets", validate(createTicketSchema), createTicket);
router.get("/tickets", getUserTickets);

export default router;
