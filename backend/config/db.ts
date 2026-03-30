import mongoose from "mongoose";
import dns from "node:dns/promises";

const connectDB = async () => {
  try {
    // Listen for successful connection
    mongoose.connection.on("connected", () => {
      console.log("✅ Database Connected");

    });
    dns.setServers(["1.1.1.1"]);
    // console.log(await dns.getServers());

    // Connect to MongoDB
    await mongoose.connect(`${process.env.MONGODB_URI}`);
  } catch (error) {
    console.error("MongoDB connection error:");
  }
};

export default connectDB;
