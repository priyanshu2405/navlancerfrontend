import express from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { reportUser } from "../controllers/admin/admin.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { reportUserSchema } from "../validations/report.validation.js";

const router = express.Router();

router.use(authMiddleware);

// Report a user
router.post("/users/:userId", validate(reportUserSchema), reportUser);

export default router;
