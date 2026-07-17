import { spawn } from "child_process";
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

    const pythonProcess = spawn("python3", [
      "../tools/search.py",
      `${paths}`,
      `${expected_names}`,
    ]);

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

// const command = `
// {
// "search": {
//   "path": ["C:","D:/Coding"],
//   "expected": ["PROJECTS"]
//   }
// }
// `;
