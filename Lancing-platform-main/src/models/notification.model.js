import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "proposal_received",
                "proposal_accepted",
                "proposal_rejected",
                "contract_completed",
                "contract_paused",
                "contract_resumed",
                "review_received",
                "dispute_raised",
                "new_job_posted",
                "system_alert"
            ],
        },
        message: {
            type: String,
            required: true,
        },
        relatedId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
