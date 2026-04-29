import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// Routes
import authRoutes from "./src/routes/auth.routes.js";
import connectDB from "./src/config/db.js";
import jobRoutes from "./src/routes/job.routes.js";
import proposalRoutes from "./src/routes/proposal.routes.js";
import messageRoutes from "./src/routes/message.routes.js";
import contractRoutes from "./src/routes/contract.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";
import freelancerRoutes from "./src/routes/freelancer.routes.js";
import clientRoutes from "./src/routes/client.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import adminRoutes from "./src/routes/admin.routes.js";
import initializeCronJobs from "./src/config/cronJobs.js";
import taxonomyRoutes from "./src/routes/taxonomy.routes.js";
import supportRoutes from "./src/routes/support.routes.js";
import reportRoutes from "./src/routes/report.routes.js";


const app = express();

const corsOptions = {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};
/* ---------- MIDDLEWARES ---------- */
app.use(express.json());
app.use(cors(corsOptions));
app.use(helmet());
app.use("/uploads", express.static("uploads"));
connectDB();

/* ---------- ROUTES ---------- */
app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/freelancers", freelancerRoutes);
app.use("/api/freelancer", freelancerRoutes); // Alias for frontend compatibility
app.use("/api/clients", clientRoutes);
app.use("/api/client", clientRoutes); // Alias for frontend compatibility
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

// Public Taxonomy (Skills & Categories)
app.use("/api/taxonomy", taxonomyRoutes);

// User Support Tickets
app.use("/api/support", supportRoutes);

// User Reporting
app.use("/api/reports", reportRoutes);



const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later."
});

app.use("/api", limiter);

// Initialize Background Tasks
initializeCronJobs();


/* ---------- SERVER ---------- */
let isconnected = false;

async function connectDB() {

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isconnected = true;
        console.log('connected to db')

    } catch (err) {
        console.log(err);
    }
}

app.use((req, res, next) => {
    if (!isconnected) {
        connectDB();
    }
    next();
})

//const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("This is Lancing Backend")
})

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString()
    });
});
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });

module.exports = app;
