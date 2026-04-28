import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/models/user.model.js";
import Job from "./src/models/job.model.js";
import Proposal from "./src/models/proposal.model.js";
import Category from "./src/models/category.model.js";
import Skill from "./src/models/skill.model.js";
import Contract from "./src/models/contract.model.js";
import Message from "./src/models/message.model.js";
import Review from "./src/models/review.model.js";
import bcrypt from "bcrypt";

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Seeding");

    // Clear existing collections
    await User.deleteMany({});
    await Job.deleteMany({});
    await Proposal.deleteMany({});
    await Category.deleteMany({});
    await Skill.deleteMany({});
    await Contract.deleteMany({});
    await Message.deleteMany({});
    await Review.deleteMany({});
    console.log("Cleared existing data.");

    // Helper functions
    const passwordHash = await bcrypt.hash("password123", 10);

    // 1. Seed Users (10 clients, 10 freelancers)
    const clients = [];
    for (let i = 1; i <= 10; i++) {
      clients.push({
        name: `Client ${i}`,
        email: `client${i}@example.com`,
        password: passwordHash,
        role: "client"
      });
    }
    const createdClients = await User.insertMany(clients);

    const freelancers = [];
    for (let i = 1; i <= 10; i++) {
      freelancers.push({
        name: `Freelancer ${i}`,
        email: `freelancer${i}@example.com`,
        password: passwordHash,
        role: "freelancer"
      });
    }
    const createdFreelancers = await User.insertMany(freelancers);
    console.log("Users seeded.");

    // 2. Seed Categories (10)
    const categories = [];
    for (let i = 1; i <= 10; i++) {
      categories.push({
        name: `Category ${i}`,
        description: `Description for Category ${i}`,
        slug: `category-${i}`,
        isActive: true
      });
    }
    const createdCategories = await Category.insertMany(categories);
    console.log("Categories seeded.");

    // 3. Seed Skills (10)
    const skills = [];
    for (let i = 1; i <= 10; i++) {
      skills.push({
        name: `Skill ${i}`,
        description: `Description for Skill ${i}`,
        isActive: true
      });
    }
    await Skill.insertMany(skills);
    console.log("Skills seeded.");

    // 4. Seed Jobs (10 open jobs from clients)
    const jobs = [];
    for (let i = 0; i < 10; i++) {
      jobs.push({
        title: `Job Title ${i + 1}`,
        description: `This is the detailed description for job ${i + 1}.`,
        budget: Math.floor(Math.random() * 1000) + 100,
        category: createdCategories[i].name,
        clientId: createdClients[i]._id,
        status: "open",
        expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        isRemote: true
      });
    }
    const createdJobs = await Job.insertMany(jobs);
    console.log("Jobs seeded.");

    // 5. Seed Proposals (10 proposals from freelancers on jobs)
    const proposals = [];
    for (let i = 0; i < 10; i++) {
      proposals.push({
        jobId: createdJobs[i]._id,
        freelancerId: createdFreelancers[i]._id,
        coverLetter: `I am highly interested in Job ${i + 1} and have the required skills.`,
        price: createdJobs[i].budget - 50,
        status: "pending"
      });
    }
    const createdProposals = await Proposal.insertMany(proposals);
    console.log("Proposals seeded.");

    // 6. Seed Contracts (10 contracts)
    const contracts = [];
    for (let i = 0; i < 10; i++) {
      contracts.push({
        jobId: createdJobs[i]._id,
        clientId: createdClients[i]._id,
        freelancerId: createdFreelancers[i]._id,
        proposalId: createdProposals[i]._id,
        status: "active",
        totalAmount: createdJobs[i].budget,
        terms: `Terms for contract ${i + 1}`,
        startDate: new Date()
      });
    }
    const createdContracts = await Contract.insertMany(contracts);
    console.log("Contracts seeded.");

    // 7. Seed Messages (10 messages)
    const messages = [];
    for (let i = 0; i < 10; i++) {
      messages.push({
        senderId: createdClients[i]._id,
        contractId: createdContracts[i]._id,
        message: `Hello Freelancer ${i + 1}, let's discuss Job ${i + 1}.`,
        isRead: false
      });
    }
    await Message.insertMany(messages);
    console.log("Messages seeded.");

    // 8. Seed Reviews (10 reviews)
    const reviews = [];
    for (let i = 0; i < 10; i++) {
      reviews.push({
        fromUser: createdClients[i]._id,
        toUser: createdFreelancers[i]._id,
        contractId: createdContracts[i]._id,
        rating: 5,
        comment: `Excellent work by Freelancer ${i + 1}.`,
        createdAt: new Date()
      });
    }
    await Review.insertMany(reviews);
    console.log("Reviews seeded.");

    console.log("All data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data: ", error);
    process.exit(1);
  }
};

seedData();
