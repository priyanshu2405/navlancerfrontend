import express from "express";

import {
  sendProposal,
  getProposalsByJob,
  hireFreelancer,
  rejectProposal,
  withdrawProposal,
  addProposalAttachment,
  editProposal,
  getMyProposals,
  bookmarkProposal,
  addClientNote,
  archiveProposal,
  searchProposals,
  acceptInvite,
  declineInvite
} from "../controllers/proposals/proposal.controller.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { proposalUpload } from "../utils/proposalUpload.js";
import {
  sendProposalSchema,
  getProposalsByJobSchema,
  proposalParamsSchema,
  editProposalSchema,
  addClientNoteSchema,
  searchProposalsSchema,
  acceptInviteSchema
} from "../validations/proposal.validation.js";

const router = express.Router();

/* Freelancer sends proposal */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(sendProposalSchema),
  sendProposal
);

/* Client views proposals for a job */
router.get(
  "/job/:jobId",
  authMiddleware,
  roleMiddleware("client"),
  validate(getProposalsByJobSchema),
  getProposalsByJob
);

/* Client hires freelancer */
router.post(
  "/hire/:proposalId",
  authMiddleware,
  roleMiddleware("client"),
  validate(proposalParamsSchema),
  hireFreelancer
);

router.post(
  "/reject/:proposalId",
  authMiddleware,
  roleMiddleware("client"),
  validate(proposalParamsSchema),
  rejectProposal
);


router.patch(
  "/:proposalId/withdraw",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(proposalParamsSchema),
  withdrawProposal
);

router.post(
  "/:proposalId/attachment",
  authMiddleware,
  roleMiddleware("freelancer"),
  proposalUpload.single("file"),
  validate(proposalParamsSchema),
  addProposalAttachment
);

router.patch(
  "/:proposalId",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(editProposalSchema),
  editProposal
);

router.get(
  "/my",
  authMiddleware,
  roleMiddleware("freelancer"),
  getMyProposals
);


router.post(
  "/:proposalId/bookmark",
  authMiddleware,
  roleMiddleware("client"),
  validate(proposalParamsSchema),
  bookmarkProposal
);

router.post(
  "/:proposalId/note",
  authMiddleware,
  roleMiddleware("client"),
  validate(addClientNoteSchema),
  addClientNote
);

router.post(
  "/:proposalId/archive",
  authMiddleware,
  roleMiddleware("client"),
  validate(proposalParamsSchema),
  archiveProposal
);

router.get(
  "/search",
  authMiddleware,
  roleMiddleware("client"),
  validate(searchProposalsSchema),
  searchProposals
);

/* FREELANCER ACTIONS ON INVITES */
router.patch(
  "/:proposalId/accept-invite",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(acceptInviteSchema),
  acceptInvite
);

router.patch(
  "/:proposalId/decline-invite",
  authMiddleware,
  roleMiddleware("freelancer"),
  validate(proposalParamsSchema),
  declineInvite
);

export default router;
