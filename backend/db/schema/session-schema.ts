import { Schema, InferSchemaType, model } from "mongoose";

const SessionSchema = new Schema({
  userId: {
    type: Schema.ObjectId,
    ref: "Users",
    required: true,
    index: true,
  },
  title: {
    type: String,
    default: "New Chat",
  },
});

export type SessionType = InferSchemaType<typeof SessionSchema>;

export const SessionModel = model("Session", SessionSchema);
