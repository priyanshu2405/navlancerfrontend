import express from "express";
import { register, login, refreshAccessToken, logout } from "../controllers/auth/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from "../validations/auth.validation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh-token", validate(refreshTokenSchema), refreshAccessToken);
router.post("/logout", validate(logoutSchema), logout);

//Test protected route
router.get("/me", authMiddleware, (req, res) => {
  res.json({
    message: "Token valid",
    user: req.user,
  });
});



export default router;
