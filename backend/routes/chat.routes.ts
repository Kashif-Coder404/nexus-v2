import express from "express";
import { sendMessage } from "../controllers/chat.controller.js";
import { chatAuthentication } from "../middlewares/auth/chatVerification.js";
import { userAuthentication } from "../middlewares/auth/authUserLogin.js";
import {
  newSession,
  sessionAuthentication,
} from "../middlewares/auth/sessionVerification.js";
import { ChatMessageType } from "../AI/Types.js";
import {
  delete_Chat_Session_Handler,
  getChatHandler,
  updateChatHandler,
} from "../services/chat.history.service.js";

const router = express.Router();

router.post(
  "/message",
  userAuthentication,
  sessionAuthentication,
  chatAuthentication,
  sendMessage,
);
router.post(
  "/history",
  userAuthentication,
  sessionAuthentication,
  chatAuthentication,
  getChatHandler,
);
router.post(
  "/delete-chat-session",
  userAuthentication,
  sessionAuthentication,
  chatAuthentication,
  delete_Chat_Session_Handler,
);
router.post("/new-chat", userAuthentication, newSession, updateChatHandler);
export default router;
