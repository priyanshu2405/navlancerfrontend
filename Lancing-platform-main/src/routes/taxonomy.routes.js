import express from "express";
import { getAllSkills, getAllCategories } from "../controllers/admin/admin.controller.js";

const router = express.Router();

// Public routes for fetching taxonomy (dropdowns, selectors, etc.)
router.get("/skills", getAllSkills);
router.get("/categories", getAllCategories);

export default router;
