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
export async function search(
  path_arg: string,
  expected_name: string,
  extension: string = "",
): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    let stdout: string = "";
    let stderr: string = "";

    const scriptPath = path.join(__dirname, "../tools/search/search.py");

    const args = [scriptPath, path_arg, expected_name];
    if (extension) {
      args.push(extension);
    }
    args.push("20");

    const pythonProcess = spawn("python", args);

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
      try {
        const json = JSON.parse(stdout);
        if (json.success) {
          resolve(json);
        } else {
          reject(json.error);
        }
      } catch (e) {
        reject(new Error(`Failed to parse Python script output: ${stdout}`));
      }
    });

    // Handle spawn error (e.g. python3 not installed or path incorrect)
    pythonProcess.on("error", (err) => {
      reject(err);
    });
  });
}

export const search_app = async (
  isDeapSearch: boolean = false,
  name: string,
  extension: string = ".lnk",
) => {
  // Desktop search
  let desktopResult: any = [];
  try {
    desktopResult = (await search("C:/Users/Kashif/Desktop/", name, extension))
      .results;
  } catch (e) {
    console.error("Desktop search failed:", e);
  }

  // Desktop/APPS search
  let appsResult: any = [];
  let publicDesktopResult: any = [];
  if (isDeapSearch) {
    try {
      appsResult = (
        await search("C:/Users/Kashif/Desktop/APPS", name, extension)
      ).results;
    } catch (e) {
      console.error("Desktop/APPS search failed:", e);
    }

    try {
      publicDesktopResult = (
        await search("C:/Users/Public/Desktop", name, extension)
      ).results;
    } catch (e) {
      console.error("Public/Desktop search failed:", e);
    }
  }
  type ResultType = {
    name: string;
    path: string;
    folder: string;
    extension: string;
    size: number;
  };
  let totalResult: ResultType[] = [
    ...desktopResult,
    ...publicDesktopResult,
    ...appsResult,
  ];
  return totalResult;
};
