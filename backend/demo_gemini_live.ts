import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

/**
 * Gemini 3 Flash Live Streaming Helper
 * Uses your local proxy on port 8082 to stream final text responses.
 */
export async function sendLiveTextMessage(prompt: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    console.log(
      "🔌 Connecting to Gemini 3 Flash Live (via http://127.0.0.1:8082)...\n",
    );
    console.log(`💬 Sent Text Prompt: "${prompt}"\n`);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8082/v1/messages",
        {
          model: "gemini-3-flash-live",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          stream: true,
        },
        {
          headers: {
            "x-api-key": "freecc",
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          responseType: "stream",
        },
      );

      process.stdout.write("🤖 Live Model Output: ");
      let fullResponseText = "";

      response.data.on("data", (chunk: Buffer) => {
        const rawText = chunk.toString();
        const lines = rawText.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const dataStr = line.slice(6).trim();
              if (dataStr === "[DONE]") continue;
              if (dataStr) {
                const parsed = JSON.parse(dataStr);

                // Anthropic-style stream delta format (which your proxy uses)
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.text
                ) {
                  const text = parsed.delta.text;
                  fullResponseText += text;
                  process.stdout.write(text);
                }
                // OpenAI-style stream delta format fallback
                else if (parsed.choices?.[0]?.delta?.content) {
                  const text = parsed.choices[0].delta.content;
                  fullResponseText += text;
                  process.stdout.write(text);
                }
              }
            } catch {
              // Ignore incomplete or unparseable JSON streaming chunks
            }
          }
        }
      });

      response.data.on("end", () => {
        console.log("\n\n✅ Turn Completed!\n");
        resolve(fullResponseText);
      });

      response.data.on("error", (err: any) => {
        console.error("\n❌ Stream Error:", err.message);
        reject(err);
      });
    } catch (error: any) {
      console.error(
        "\n❌ Connection Error (Is 'npm run proxy' running?):",
        error.message,
      );
      reject(error);
    }
  });
}

// Execute Demo
sendLiveTextMessage("Explain WebSockets in 2 brief sentences.");
