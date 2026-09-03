import { promises as fs } from "fs";
import fsSync from "fs";
import path from "path";
import process from "process";

const IGNORED_DIRS = new Set([
  "$recycle.bin",
  "system volume information",
  "node_modules",
  ".git",
  ".vscode",
  "appdata",
  "windows",
  "program files",
  "program files (x86)",
  "programdata",
  "perflogs",
]);

export interface SearchResult {
  name: string;
  path: string;
  type: "folder" | "file" | "ERROR";
}

/**
 * Fast detection of available active Windows drives (e.g. ["C:\\", "D:\\"])
 * Runs in < 1ms synchronously with zero external processes or circular dependencies.
 */
export function getAvailableDrives(): string[] {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const drives: string[] = [];
  for (const letter of letters) {
    const drive = `${letter}:\\`;
    try {
      if (fsSync.existsSync(drive)) {
        drives.push(drive);
      }
    } catch {}
  }
  return drives;
}

/**
 * Whitespace, hyphen, and symbol-insensitive matching
 */
export function matchesSearchToken(
  targetName: string,
  queryToken: string,
): boolean {
  if (!queryToken) return true;

  const nameLower = targetName.toLowerCase();
  const tokenLower = queryToken.toLowerCase().trim();

  // 1. Direct substring match
  if (nameLower.includes(tokenLower)) return true;

  // 2. Normalized match (ignores spaces, hyphens, underscores, dots)
  // "Microsoft VS Code" -> "microsoftvscode"
  // "vs code"           -> "vscode"
  // "vscode"            -> "vscode"
  const cleanName = nameLower.replace(/[\s\-_.]/g, "");
  const cleanToken = tokenLower.replace(/[\s\-_.]/g, "");
  if (cleanName.includes(cleanToken)) return true;

  // 3. Multi-word match: if query has multiple words, all words must exist in name
  const words = tokenLower.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => nameLower.includes(w))) {
    return true;
  }

  // 4. Common Acronym Match (e.g. "vscode" -> "Visual Studio Code")
  if (cleanToken.startsWith("vs") && nameLower.includes("visual studio")) {
    const rest = cleanToken.slice(2);
    if (!rest || nameLower.includes(rest)) return true;
  }

  return false;
}

/**
 * Multi-drive global filesystem search
 */
async function globalSearch(
  searchToken: string = "",
  type: "folder" | "file" | "all" = "all",
  extension: string = "",
  isDeepSearch: boolean = false,
  maxResults: number = 10,
): Promise<SearchResult[]> {
  const drives = getAvailableDrives();
  const allResults: SearchResult[] = [];
  const maxDepthPerDrive = isDeepSearch ? 6 : 3;

  for (const drive of drives) {
    if (allResults.length >= maxResults) break;
    const remaining = maxResults - allResults.length;
    const matches = await nexusSmartSearch(
      drive,
      searchToken,
      type,
      extension,
      false, // isGlobalSearch
      isDeepSearch,
      remaining,
      [],
      maxDepthPerDrive,
      0,
    );
    allResults.push(...matches);
  }
  return allResults;
}

/**
 * Super-fast, zero-dependency filesystem search for files and folders.
 */
export async function nexusSmartSearch(
  dir: string = "",
  searchToken: string = "",
  type: "folder" | "file" | "all" = "all",
  extension: string = "",
  isGlobalSearch: boolean = false,
  isDeepSearch: boolean = false,
  maxResults: number = 10,
  results: SearchResult[] = [],
  maxDepth: number = 10,
  currentDepth: number = 0,
): Promise<SearchResult[]> {
  if (!searchToken) {
    return [
      {
        name: "PROVIDE THE SEARCH TOKEN",
        path: "",
        type: "ERROR",
      },
    ];
  }

  const targetDir = (dir || "").trim();

  // If global search requested or no directory passed, search across all available drives
  if (isGlobalSearch || !targetDir) {
    return await globalSearch(
      searchToken,
      type,
      extension,
      isDeepSearch,
      maxResults,
    );
  }

  if (results.length >= maxResults || currentDepth > maxDepth) return results;

  let entries: any;
  try {
    entries = await fs.readdir(targetDir, { withFileTypes: true });
  } catch {
    return results;
  }

  const extNormalized = extension.trim()
    ? extension.trim().startsWith(".")
      ? extension.trim().toLowerCase()
      : `.${extension.trim().toLowerCase()}`
    : "";

  const subdirs: string[] = [];

  for (const entry of entries) {
    if (results.length >= maxResults) break;

    // Prevent infinite loops on Windows junction points or symlinks
    if (entry.isSymbolicLink?.()) {
      continue;
    }

    const name = entry.name;
    const nameLower = name.toLowerCase();
    const isDir = entry.isDirectory();

    // 1. PRUNE: Skip system/heavy junk & hidden dot folders before reading inside
    if (
      IGNORED_DIRS.has(nameLower) ||
      name.startsWith("$") ||
      name.startsWith(".")
    ) {
      continue;
    }

    if (isDir) {
      subdirs.push(path.join(targetDir, name));
    }

    // 2. MATCH CONDITIONS
    const matchesName = matchesSearchToken(name, searchToken);
    const matchesType =
      type === "all" ? true : type === "folder" ? isDir : !isDir;

    let matchesExt = true;
    if (extNormalized) {
      if (isDir) {
        matchesExt = false;
      } else {
        matchesExt = nameLower.endsWith(extNormalized);
      }
    }

    if (matchesName && matchesType && matchesExt) {
      results.push({
        name,
        path: path.join(targetDir, name),
        type: isDir ? "folder" : "file",
      });
    }
  }

  // 3. Recurse into valid directories until maxResults is reached
  for (const subdir of subdirs) {
    if (results.length >= maxResults) break;
    await nexusSmartSearch(
      subdir,
      searchToken,
      type,
      extension,
      false,
      isDeepSearch,
      maxResults,
      results,
      maxDepth,
      currentDepth + 1,
    );
  }

  return results;
}

/**
 * Super-fast application & shortcut search across Start Menu, Desktops,
 * User Programs, Store apps, and Program Files.
 */
export async function nexusSmartSearchApp(
  appName: string,
  isDeepSearch: boolean = false,
  maxResults: number = 10,
  extension: string = "",
): Promise<SearchResult[]> {
  if (!appName) return [];

  const userProfile = process.env.USERPROFILE || "C:/Users/Default";
  const publicProfile = process.env.PUBLIC || "C:/Users/Public";
  const appData =
    process.env.APPDATA || path.join(userProfile, "AppData", "Roaming");
  const localAppData =
    process.env.LOCALAPPDATA || path.join(userProfile, "AppData", "Local");
  const programData = process.env.PROGRAMDATA || "C:/ProgramData";

  // Standard root directories where Windows applications and shortcuts live
  const appRoots: { dir: string; maxDepth: number }[] = [
    // 1. Start Menu Shortcuts (Where 95% of apps place .lnk files)
    {
      dir: path.join(appData, "Microsoft", "Windows", "Start Menu", "Programs"),
      maxDepth: 4,
    },
    {
      dir: path.join(
        programData,
        "Microsoft",
        "Windows",
        "Start Menu",
        "Programs",
      ),
      maxDepth: 4,
    },

    // 2. User & Public Desktops
    { dir: path.join(userProfile, "Desktop"), maxDepth: 2 },
    { dir: path.join(publicProfile, "Desktop"), maxDepth: 2 },
    { dir: path.join(userProfile, "Desktop", "APPS"), maxDepth: 2 },

    // 3. User Installed Programs & Microsoft Store App Aliases
    { dir: path.join(localAppData, "Programs"), maxDepth: 4 },
    { dir: path.join(localAppData, "Microsoft", "WindowsApps"), maxDepth: 2 },
  ];

  // 4. If Deep Search enabled, also include main Program Files and custom drives
  if (isDeepSearch) {
    appRoots.push(
      { dir: "C:/Program Files", maxDepth: 3 },
      { dir: "C:/Program Files (x86)", maxDepth: 3 },
      { dir: path.join(userProfile, "Downloads"), maxDepth: 2 },
      { dir: "D:/Games", maxDepth: 3 },
      { dir: "D:/Apps", maxDepth: 3 },
    );
  }

  const tokenLower = appName.trim().toLowerCase();
  const extNormalized = extension.trim()
    ? extension.trim().startsWith(".")
      ? extension.trim().toLowerCase()
      : `.${extension.trim().toLowerCase()}`
    : "";

  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const { dir, maxDepth } of appRoots) {
    if (results.length >= maxResults) break;

    try {
      await fs.access(dir);
    } catch {
      continue;
    }

    // Pass fresh [] to prevent double-pushing into results
    const matches = await nexusSmartSearch(
      dir,
      tokenLower,
      "all",
      extNormalized,
      false,
      isDeepSearch,
      maxResults - results.length,
      [],
      maxDepth,
      0,
    );

    for (const match of matches) {
      const lowerPath = match.path.toLowerCase();
      const isExecutableExt =
        lowerPath.endsWith(".lnk") ||
        lowerPath.endsWith(".exe") ||
        lowerPath.endsWith(".url");

      const isMatch = extNormalized
        ? lowerPath.endsWith(extNormalized)
        : isExecutableExt || match.type === "folder";

      if (isMatch && !seen.has(lowerPath)) {
        seen.add(lowerPath);
        results.push(match);
      }
    }
  }

  // Fallback: If not found in standard paths and not deep search, check Program Files
  if (results.length === 0 && !isDeepSearch) {
    const fallbackRoots = [
      { dir: "C:/Program Files", maxDepth: 3 },
      { dir: "C:/Program Files (x86)", maxDepth: 3 },
    ];

    for (const { dir, maxDepth } of fallbackRoots) {
      if (results.length >= maxResults) break;

      try {
        await fs.access(dir);
      } catch {
        continue;
      }

      const matches = await nexusSmartSearch(
        dir,
        tokenLower,
        "all",
        extNormalized,
        false,
        false,
        maxResults - results.length,
        [],
        maxDepth,
        0,
      );

      for (const match of matches) {
        const lowerPath = match.path.toLowerCase();
        const isExecutableExt =
          lowerPath.endsWith(".lnk") ||
          lowerPath.endsWith(".exe") ||
          lowerPath.endsWith(".url");

        const isMatch = extNormalized
          ? lowerPath.endsWith(extNormalized)
          : isExecutableExt || match.type === "folder";

        if (isMatch && !seen.has(lowerPath)) {
          seen.add(lowerPath);
          results.push(match);
        }
      }
    }
  }

  return results;
}

// Backwards-compatible aliases
export const search = nexusSmartSearch;
export const search_app = nexusSmartSearchApp;
