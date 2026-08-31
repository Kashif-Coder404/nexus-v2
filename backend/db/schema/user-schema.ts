import { InferSchemaType, model, Schema } from "mongoose";

const deviceSchema = new Schema({
  deviceToken: {
    type: String,
    required: true,
  },
  deviceName: {
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
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  devices: {
    type: [deviceSchema],
    default: [],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

type IUser = InferSchemaType<typeof userSchema>;
export const UserModel = model<IUser>("Users", userSchema);
