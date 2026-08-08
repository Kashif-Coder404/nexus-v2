import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export async function connectDB() {
  try {
    const MONGOURI: string = process.env.MONGO_URI || "";
    await mongoose.connect(MONGOURI);
    console.log("DB CONNECTED SUCCESSFULLY! ✅");
  } catch (error) {
    console.log("ERROR WHILE CONNECTING TO DB 🫠");
  }
}
