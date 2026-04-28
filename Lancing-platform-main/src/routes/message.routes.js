import express from "express";
import {
  sendMessage,
  getMessages,
  getConversations,
} from "../controllers/messages/message.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  sendMessageSchema,
  getMessagesSchema
} from "../validations/message.validation.js";

const router = express.Router();

router.post("/", authMiddleware, validate(sendMessageSchema), sendMessage);
router.get("/conversations", authMiddleware, getConversations);
router.get("/:contractId", authMiddleware, validate(getMessagesSchema), getMessages);

export default router;
