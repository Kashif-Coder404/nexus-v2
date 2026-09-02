import { spawn } from "child_process";
import path from "path";
export type SearchOutput = {
  stdout: string;
  stderr: string;
  cmd: string;
};
export interface SearchResultItem {
  name: string;
  path: string;
  folder: string;
  extension: string;
  size?: number;
}

export interface SearchResponse {
  success: boolean;
  query: string;
  count: number;
  results: SearchResultItem[];
}

export async function search(
  path_arg: string = "",
  expected_name: string = "",
  extension: string = "",
): Promise<SearchResponse> {
  return new Promise<SearchResponse>((resolve, reject) => {
    let stdout: string = "";
    let stderr: string = "";

    const scriptPath = path.join(__dirname, "../Tools/search/search.py");

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
        reject(new Error(`Failed to parse Python script output: ${stdout || stderr}`));
      }
    });

    // Handle spawn error (e.g. python not installed or path incorrect)
    pythonProcess.on("error", (err) => {
      reject(err);
    });
  });
}

export const search_app = async (
  isDeepSearch: boolean = false,
  name: string = "",
  extension: string = ".lnk",
): Promise<SearchResultItem[]> => {
  const userProfile = process.env.USERPROFILE || "C:/Users/Default";
  const publicProfile = process.env.PUBLIC || "C:/Users/Public";

  const userDesktop = path.join(userProfile, "Desktop");
  const appsDesktop = path.join(userDesktop, "APPS");
  const publicDesktop = path.join(publicProfile, "Desktop");

  // Desktop search
  let desktopResult: SearchResultItem[] = [];
  try {
    const res = await search(userDesktop, name, extension);
    desktopResult = res.results || [];
  } catch (e) {
    console.error("[SEARCH SERVICE] Desktop search failed:", e);
  }

  // Desktop/APPS & Public Desktop search
  let appsResult: SearchResultItem[] = [];
  let publicDesktopResult: SearchResultItem[] = [];
  if (isDeepSearch) {
    try {
      const res = await search(appsDesktop, name, extension);
      appsResult = res.results || [];
    } catch (e) {
      console.error("[SEARCH SERVICE] Desktop/APPS search failed:", e);
    }

    try {
      const res = await search(publicDesktop, name, extension);
      publicDesktopResult = res.results || [];
    } catch (e) {
      console.error("[SEARCH SERVICE] Public/Desktop search failed:", e);
    }
  }

  return [...desktopResult, ...publicDesktopResult, ...appsResult];
};
