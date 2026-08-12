import { Schema, InferSchemaType, model } from "mongoose";

const SessionSchema = new Schema({
  sessionid: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
  }
});

export type SessionType = InferSchemaType<typeof SessionSchema>;

export const SessionModel = model("Session", SessionSchema);
