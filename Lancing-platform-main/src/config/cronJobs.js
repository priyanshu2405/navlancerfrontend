import cron from "node-cron";
import Job from "../models/job.model.js";
import Proposal from "../models/proposal.model.js";

const runCleanupTasks = async () => {
    // console.log("Running cleanup tasks for expired jobs and proposals...");
    try {
        // 1. Auto-close expired jobs
        const jobResult = await Job.updateMany(
            {
                status: "open",
                isDeleted: false,
                expiryDate: { $lt: new Date() },
            },
            { status: "expired" }
        );
        // console.log(`[Cleanup] Marked ${jobResult.modifiedCount} jobs as expired.`);

        // 2. Auto-expire pending proposals that passed their expiration date
        const proposalResult = await Proposal.updateMany(
            {
                status: "pending",
                expiresAt: { $lt: new Date() },
            },
            { status: "expired" }
        );
        // console.log(
        //     `[Cleanup] Marked ${proposalResult.modifiedCount} proposals as expired.`
        // );
    } catch (error) {
        console.error("[Cleanup Error] Failed to execute cleanup tasks:", error);
    }
};

const initializeCronJobs = () => {
    // Run immediately when server starts (Helpful for Local Development)
    runCleanupTasks();

    // Run every midnight (00:00) for Production
    cron.schedule("0 0 * * *", runCleanupTasks);

    // console.log("Cron jobs & Cleanup tasks initialized.");
};

export default initializeCronJobs;
