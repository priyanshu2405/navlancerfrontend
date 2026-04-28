import mongoose from "mongoose";

const userReportSchema = new mongoose.Schema(
    {
        reporterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reportedUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reason: {
            type: String,
            required: true,
            enum: [
                "fraud",
                "harassment",
                "spam",
                "inappropriate_content",
                "fake_profile",
                "other"
            ]
        },
        description: {
            type: String,
            required: true,
            minlength: 10,
            maxlength: 1000
        },
        status: {
            type: String,
            enum: ["open", "investigated", "closed"],
            default: "open"
        },
        adminNotes: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

const UserReport = mongoose.model("UserReport", userReportSchema);
export default UserReport;
