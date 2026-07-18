import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export type SearchOutput = {
  stdout: string;
  stderr: string;
  cmd: string;
};
export async function search_app(
  paths: string[],
  expected_names: string[],
): Promise<SearchOutput> {
  return new Promise<SearchOutput>((resolve, reject) => {
    let stdout: string = "";
    let stderr: string = "";
    let cmd: string = "";

    const scriptPath = path.join(__dirname, "../tools/search/search.py");

    // Construct Everything SDK query
    // e.g. "D:\Coding"|"C:\" Projects|nexus
    const normalizedPaths = paths
      .map((p) => `"${p.replace(/\//g, "\\")}"`)
      .join("|");
    console.log("Normalized Paths: ", normalizedPaths);
    const searchTerms = expected_names.join("|");
    console.log("Search Terms: ", searchTerms);
    const query = `${normalizedPaths} ${searchTerms}`.trim();

    const pythonProcess = spawn("python", [scriptPath, query, "20"]);

    // Collect stdout
    pythonProcess.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    // Collect stderr
    pythonProcess.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Resolve the promise when the process exits
    pythonProcess.on("close", (code) => {
      resolve({ stdout, stderr, cmd });
    });

    // Handle spawn error (e.g. python3 not installed or path incorrect)
    pythonProcess.on("error", (err) => {
      reject(err);
    });
  });
}

// try {
//   console.log("Running search test...");
//   const result = await search_app(
//     ["D:/Coding/Leetcode/JS"],
//     ["Leetcode", "valide", "Valide"],
//   );
//   console.log("Search Output:\n", JSON.parse(result.stdout));
//   if (result.stderr) {
//     console.error("Search Error:\n", result.stderr);
//   }
// } catch (e) {
//   console.error("Failed to run test:", e);
// }
