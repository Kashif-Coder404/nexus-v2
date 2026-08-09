import { InferSchemaType, Schema, model } from "mongoose";

const chatSchema: Schema = new Schema({
  role: {
    type: String,
    required: true,
    enum: ["user", "assistant"],
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
type IChat = InferSchemaType<typeof chatSchema>;

export const ChatModel = model<IChat>("Chat", chatSchema);
