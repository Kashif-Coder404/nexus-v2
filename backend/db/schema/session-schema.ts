import { Schema, InferSchemaType, model } from "mongoose";

const SessionSchema = new Schema({
  sessionid: {
    type: String,
    required: true,
  },
  userId: {
    type: 
  }
});

export type SessionType = InferSchemaType<typeof SessionSchema>;

export const SessionModel = model("Session", SessionSchema);
