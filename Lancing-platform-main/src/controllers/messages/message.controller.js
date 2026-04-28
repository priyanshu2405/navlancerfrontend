import contractModel from "../../models/contract.model.js";
import messageModel from "../../models/message.model.js";

/* SEND MESSAGE */
export const sendMessage = async (req, res) => {
  try {
    const { contractId, message } = req.body;

    const contract = await contractModel.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // only client or freelancer of this contract
    if (
      contract.clientId.toString() !== req.user.id &&
      contract.freelancerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // CHECK if contract is active before allowing chat
    if (contract.status !== "active") {
      return res.status(400).json({
        message: "This contract is no longer active. Chat is disabled, but you can still view history."
      });
    }

    const msg = await messageModel.create({
      contractId,
      senderId: req.user.id,
      message,
    });

    res.status(201).json({ message: "Message sent", msg });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET MESSAGES BY CONTRACT */
export const getMessages = async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await contractModel.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    if (
      contract.clientId.toString() !== req.user.id &&
      contract.freelancerId.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await messageModel.find({ contractId }).sort("createdAt");
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET ALL CONVERSATIONS (CONTRACTS) FOR USER */
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find all contracts where the user is either the client or the freelancer
    const contracts = await contractModel.find({
      $or: [{ clientId: userId }, { freelancerId: userId }]
    })
      .populate("jobId", "title budget")
      .populate("clientId", "name email")
      .populate("freelancerId", "name email")
      .sort("-updatedAt");

    res.json(contracts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
