import express from "express";
import {
  getContractById,
  completeContract,
  requestCancelContract,
  approveCancelContract,
  pauseContract,
  resumeContract,
  requestExtension,
  approveExtension,
  rejectExtension,
  getContractActivity,
  resolveDispute,
  raiseDispute,
  getMyContracts,
  addMilestone,
  updateMilestoneStatus,
  deleteMilestone,
} from "../controllers/contracts/contract.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  contractParamsSchema,
  requestCancelContractSchema,
  requestExtensionSchema,
  raiseDisputeSchema,
  addMilestoneSchema,
  milestoneParamsSchema,
  updateMilestoneSchema
} from "../validations/contract.validation.js";

const router = express.Router();

// GET all contracts for user
router.get("/my", authMiddleware, getMyContracts);
router.get("/active", authMiddleware, (req, res, next) => {
  req.query.status = "active";
  getMyContracts(req, res, next);
});
router.get("/freelancer", authMiddleware, getMyContracts);

// GET contract by ID
router.get("/:contractId", authMiddleware, validate(contractParamsSchema), getContractById);

// Complete contract
router.post(
  "/complete/:contractId",
  authMiddleware,
  roleMiddleware("client"),
  validate(contractParamsSchema),
  completeContract
);

router.post(
  "/:contractId/cancel-request",
  authMiddleware,
  validate(requestCancelContractSchema),
  requestCancelContract
);

router.post(
  "/:contractId/approve-cancel",
  authMiddleware,
  validate(contractParamsSchema),
  approveCancelContract
);

router.post(
  "/:contractId/pause",
  authMiddleware,
  validate(contractParamsSchema),
  pauseContract
);

router.post(
  "/:contractId/resume",
  authMiddleware,
  validate(contractParamsSchema),
  resumeContract
);

router.post(
  "/:contractId/request-extension",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(requestExtensionSchema),
  requestExtension
);

router.post(
  "/:contractId/approve-extension",
  authMiddleware,
  roleMiddleware("client"),
  validate(contractParamsSchema),
  approveExtension
);

router.post(
  "/:contractId/reject-extension",
  authMiddleware,
  roleMiddleware("client"),
  validate(contractParamsSchema),
  rejectExtension
);

router.get(
  "/:contractId/activity",
  authMiddleware,
  validate(contractParamsSchema),
  getContractActivity
);

router.post(
  "/:contractId/raise-dispute",
  authMiddleware,
  validate(raiseDisputeSchema),
  raiseDispute
);

router.post(
  "/:contractId/resolve-dispute",
  authMiddleware,
  validate(contractParamsSchema),
  resolveDispute
);

/* --- MILESTONE API --- */
router.post(
  "/:contractId/milestones",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(addMilestoneSchema),
  addMilestone
);

router.patch(
  "/:contractId/milestones/:milestoneId",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(updateMilestoneSchema),
  updateMilestoneStatus
);

router.delete(
  "/:contractId/milestones/:milestoneId",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(milestoneParamsSchema),
  deleteMilestone
);

export default router;
