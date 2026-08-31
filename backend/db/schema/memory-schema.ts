import { Schema, model, InferSchemaType } from "mongoose";

const memorySchema = new Schema({
  userId: {
    type: String,
    required: true,
  },
  aliases: {
    type: [String],
    required: true,
    default: [],
  },
  value: {
    type: String,
    required: true,
  },
  category: {
    type: [String],
    default: "path",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
  useCount: {
    type: Number,
    default: 0,
  },
});
type Memory = InferSchemaType<typeof memorySchema>;
export const MemoryModel = model<Memory>("Memory", memorySchema);
