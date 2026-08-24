import { timeStamp } from "console";
import { InferSchemaType, Schema, model } from "mongoose";

const chatSchema: Schema = new Schema({
  userId: {
    type: Schema.ObjectId,
    ref: "Users",
    required: true,
    index: true,
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
  },
  chatMessage: [
    {
      role: {
        type: String,
        required: true,
        enum: ["user", "assistant"],
      },
      content: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
chatSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
export type IChat = InferSchemaType<typeof chatSchema>;

export const ChatModel = model<IChat>("Chat", chatSchema);
