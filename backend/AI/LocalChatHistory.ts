import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get chat History file path
function getFilePath(session: string): string {
  return path.join(__dirname, "chats", `chat_${session}.json`);
}

// Helper to check if file exists
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function setHistory(
  data: Array<{ role: string; content: string }>,
  session: string,
): Promise<boolean> {
  try {
    const logFilePath = getFilePath(session);

    await fs.mkdir(path.dirname(logFilePath), { recursive: true });
    await fs.writeFile(logFilePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("[LOCAL CHAT HISTORY] Error setting history:", error);
    return false;
  }
}

export async function getHistory(
  session: string,
  nMsg: number = 10,
): Promise<Array<{ role: string; content: string }>> {
  try {
    const logFilePath = getFilePath(session);
    if (!(await fileExists(logFilePath))) {
      return [];
    }
    const data = await fs.readFile(logFilePath, "utf-8");
    return JSON.parse(data).slice(-nMsg);
  } catch (error) {
    console.error("[LOCAL CHAT HISTORY] Error getting history:", error);
    return [];
  }
}

export async function appendHistory(
  newMessages: Array<{ role: string; content: string }>,
  session: string,
): Promise<boolean> {
  try {
    const logFilePath = getFilePath(session);
    await fs.mkdir(path.dirname(logFilePath), { recursive: true });

    let existingData: Array<{ role: string; content: string }> = [];
    if (await fileExists(logFilePath)) {
      const fileContent = await fs.readFile(logFilePath, "utf-8");
      if (fileContent.trim()) {
        existingData = JSON.parse(fileContent);
      }
    }

    const updatedData = [...existingData, ...newMessages];
    await fs.writeFile(logFilePath, JSON.stringify(updatedData, null, 2));
    return true;
  } catch (error) {
    console.error("[LOCAL CHAT HISTORY] Error appending history:", error);
    return false;
  }
}
