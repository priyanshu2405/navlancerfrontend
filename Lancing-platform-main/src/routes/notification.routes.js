import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  markAsRead,
  getUnreadCount
} from "../controllers/notifications/notification.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getMyNotifications);

router.get("/unread-count", authMiddleware, getUnreadCount);

router.patch(
  "/:notificationId/read",
  authMiddleware,
  markAsRead
);

export default router;
