import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LogStructure {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
}

/**
 * Creates and appends logs in JSON format.
 * Writes each log entry as a JSON line into `backend/logs/app.log` (JSON Lines format)
 * and prints it to the console with clean formatting.
 * 
 * @param messageOrData The log message (string) or the payload object/array to log.
 * @param level The log level (e.g. "info", "warn", "error", "debug"). Defaults to "info".
 * @param additionalData Optional metadata or extra context object.
 * @returns Promise<boolean> True if logging succeeded, false otherwise.
 */
export async function Logs(
  messageOrData: any,
  level: string = "info",
  additionalData?: any
): Promise<boolean> {
  try {
    const logDir = path.join(__dirname, "logs");
    const logFilePath = path.join(logDir, "app.log");

    // Ensure the logs directory exists
    await fs.mkdir(logDir, { recursive: true });

    let message = "";
    let data: any = additionalData;

    if (messageOrData instanceof Error) {
      message = messageOrData.message;
      data = {
        stack: messageOrData.stack,
        ...data,
      };
    } else if (typeof messageOrData === "object" && messageOrData !== null) {
      message = messageOrData.message || JSON.stringify(messageOrData);
      data = {
        payload: messageOrData,
        ...data,
      };
    } else {
      message = String(messageOrData);
    }

    const logEntry: LogStructure = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      message,
      ...(data !== undefined && { data }),
    };

    // Append to file as a JSON Line
    await fs.appendFile(logFilePath, JSON.stringify(logEntry) + "\n", "utf8");

    // Color code console outputs for better readability in terminal
    let color = "\x1b[32m"; // green (info)
    if (level === "error") color = "\x1b[31m"; // red
    if (level === "warn") color = "\x1b[33m"; // yellow
    if (level === "debug") color = "\x1b[36m"; // cyan
    const reset = "\x1b[0m";

    console.log(
      `[${logEntry.timestamp}] ${color}[${level.toUpperCase()}]${reset} ${message}`,
      data ? JSON.stringify(data) : ""
    );

    return true;
  } catch (error) {
    console.error("Failed to write JSON log:", error);
    return false;
  }
}

