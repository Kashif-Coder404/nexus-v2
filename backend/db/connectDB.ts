import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
export async function connectDB() {
  try {
    const MONGOURI: string = process.env.MONGO_URI || "";
    await mongoose.connect(MONGOURI);
    // console.log("DB CONNECTED SUCCESSFULLY! ✅");
  } catch (error) {
    console.error("[DATABASE] ERROR WHILE CONNECTING TO DB 🫠");
  }
}


// let tempCMD: string = "memory_write | | | |";
// const matchedKey: string = tempCMD.trim().split("|")[0].trim();
// console.log(commandHandlerDict[matchedKey as keyof typeof commandHandlerDict]);
