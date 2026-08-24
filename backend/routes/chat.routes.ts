import express from "express";
import { sendMessage } from "../controllers/chat.controller.js";
import { chatAuthentication } from "../middlewares/auth/chatVerification.js";
import { userAuthentication } from "../middlewares/auth/authUserLogin.js";
import { sessionAuthentication } from "../middlewares/auth/sessionVerification.js";

const router = express.Router();

router.post(
  "/message",
  userAuthentication,
  sessionAuthentication,
  chatAuthentication,
  sendMessage,
);

export default router;
