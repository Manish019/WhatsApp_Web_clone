// database/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load .env variables
dotenv.config();

// Get MongoDB URL from env
const mongoUrl = process.env.MONGO_URL;

mongoose.connect(mongoUrl)
  .then(() => {
    console.log(" DB connected successfully");
  })
  .catch((err) => {
    console.log(" DB connection failed:", err.message);
  });
