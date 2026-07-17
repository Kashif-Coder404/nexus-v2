import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get history file path
function getFilePath(session: string): string {
  return path.join(__dirname, "history", `history_${session}.json`);
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
    console.error("Error setting history:", error);
    return false;
  }
}

export async function getHistory(
  session: string,
  nMsg: number = 10,
): Promise<Array<{ role: string; content: string }>> {
  try {
    const logFilePath = getFilePath(session);
    const data = await fs.readFile(logFilePath, "utf-8");
    return JSON.parse(data).slice(-nMsg);
  } catch (error) {
    return [];
  }
}
