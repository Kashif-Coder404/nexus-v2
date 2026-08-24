import { error } from "node:console";
import { connectDB } from "./db/connectDB.js";
import { UserModel } from "./db/schema/user-schema.js";
import { ChatModel } from "./db/schema/chat-schema.js";
import { SessionModel } from "./db/schema/session-schema.js";
import { Schema } from "node:inspector/promises";
import { ChatMessageType } from "./AI/Types.js";

type EmailString = string & {
  _brand: "email";
};

async function runDBTest() {
  try {
    await connectDB();
    const user = await getUser("kashif@nexus.dev");
    if (!user) {
      console.log("User is not found the for the email!");
      return;
    }
    const session = await getSession("random", user?._id as Object);
    // if (!session) {
    //   console.log("Session is not found the for the user!:", user?._id);
    //   return;
    // }
    const chat = await getChat("session_kashif_002", user?._id as Object);
    if (!chat) {
      console.log("Chat is not found the for the user!: ", user?._id);
      return;
    }
    console.log("USER: ", user);
    console.log("Session: ", session);
    console.log("Chat: ", chat);
    if (chat) {
      console.log("CHAT MESSAGES: ", chat.chatMessage);
    }
  } catch (error) {
    console.error(error);
  }
}
async function getUser(email: string) {
  try {
    const user = await UserModel.findOne({ email });
    return user;
  } catch (error) {
    console.error(error);
  }
}
async function getSession(sessionId: string, userId: Object) {
  try {
    const session = await SessionModel.findOne({
      sessionId,
      userId,
    });
    return session;
  } catch (error) {
    console.error(error);
  }
}
async function getChat(sessionId: string, userId: Object) {
  try {
    const chat = await ChatModel.findOne({
      sessionId: sessionId,
      $or: [{ userId: userId }],
    });
    return chat;
  } catch (error) {
    console.error(error);
  }
}
async function MainGetChat(sessionId: string, userId: string) {
  const session = await SessionModel.findOne({
    $or: [{ sessionId: sessionId }, { userId: userId }],
  });
  console.log(session);
  if (!session)
    return {
      success: false,
      message: "Session not found",
    };
  const user = await UserModel.findById(session.userId);
  if (!user)
    return {
      success: false,
      message: "User not found",
    };
  const chat = await ChatModel.find({
    sessionId: sessionId,
    $or: [{ userId: userId }],
  });
  const ChatMessages: ChatMessageType[] = chat[0]
    .chatMessage as ChatMessageType[];
  console.log("Chat Messages: ", ChatMessages);
  return ChatMessages;
}
await runDBTest();
// await MainGetChat("session_kashif_001", "66c7f1a10000000000000001");
// await runDBTest();
// const user = await getUser("KashifTestingDB@DBTest.com");
// const session = await getSession("session_testing_001", user?._id as Object);
// const chat = await getChat("session_testing_001", user?._id as Object);
// console.log("User: ", user);
// console.log("Session: ", session);
// console.log("Chat: ", chat);
