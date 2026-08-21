import { askAI } from "./askAIv2.js";

async function run() {
  console.log("Testing...");
  const res = await askAI("test_session_555", "run the command echo hello world");
  console.log("RESULT:", res);
}
run();
