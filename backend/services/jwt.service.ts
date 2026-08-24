import { initializeKeys, JWT_SECRET } from "../EnvVariables.js";
import jwt, { SignOptions } from "jsonwebtoken";
await initializeKeys();
export type JWT_PAYLOAD_TYPE = {
  userId: string;
  email?: string;
  role?: string;
};

export const generateToken = (
  payload: JWT_PAYLOAD_TYPE,
  expiresIn: SignOptions["expiresIn"] = "1h",
): string | null => {
  try {
    const token: string = jwt.sign(payload, JWT_SECRET!, { expiresIn });
    return token;
  } catch (error) {
    console.error("[JWT SERVICE] Error generating token:", error);
    return null;
  }
};

export const verifyToken = (token: string) => {
  try {
    const decodedToken = jwt.verify(token, JWT_SECRET!);
    return decodedToken;
  } catch (err: any) {
    console.error("[JWT SERVICE] Error verifying token:", err.message);
    return null;
  }
};
