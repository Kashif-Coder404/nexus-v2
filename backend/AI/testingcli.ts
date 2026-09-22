import { callAI } from "./CallAI.js";
import { imageInstructions } from "./instructions/image.instructions.js";

async function testing() {
  const result = await callAI("gemini", {
    chatMessages: [
      { role: "user", content: "Hello, how are you?" },
      {
        role: "assistant",
        content: "I'm doing great! How can I help you today?",
      },
      { role: "user", content: "I want to learn more about programming." },
      {
        role: "assistant",
        content:
          "Absolutely! What programming topic would you like to explore?",
      },
      { role: "user", content: "I'm currently learning JavaScript and C#." },
      {
        role: "assistant",
        content:
          "That's a great combination. JavaScript is excellent for web development, while C# is useful for building backend services and Windows applications.",
      },
      { role: "user", content: "Which one should I focus on first?" },
      {
        role: "assistant",
        content:
          "Since you're already comfortable with JavaScript, I'd recommend strengthening it while gradually learning C# through small projects.",
      },
      { role: "user", content: "Can you give me a small project idea?" },
      {
        role: "assistant",
        content:
          "Sure. You could build a simple task manager with a JavaScript frontend and a C# backend.",
      },
      { role: "user", content: "That sounds interesting. I'll try it." },
    ],
    session: "123",
    model: "gemini-3.5-flash-lite",
  });
  console.log(result);
}
testing();
