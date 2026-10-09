using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Features;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.VisualBasic;
using JsonSerializer = System.Text.Json.JsonSerializer;
namespace Nexus.Agent.Services;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum SearchType
{
    Folder,
    File,
    Both,
}
public record SearchResults(string Name, string Path, string Type);
public static class SearchServices
{
    private static readonly HashSet<string> IgnoredDirs = new(StringComparer.OrdinalIgnoreCase)
    {
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
        "perflogs"
    };
    private static readonly HashSet<string> AppTargetPaths = new(StringComparer.OrdinalIgnoreCase)
    {
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\Windows\Start Menu\Programs"),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), @"Microsoft\Windows\Start Menu\Programs"),
        Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
        Environment.GetFolderPath(Environment.SpecialFolder.CommonDesktopDirectory),
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs"),
        Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
        Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86),
    };
    private static readonly HashSet<string> AppIgnorePaths = new(StringComparer.OrdinalIgnoreCase)
    {
        "$recycle.bin",
        "system volume information",
        "node_modules",
        ".git",
        ".vscode",
        "appdata",
        "windows",
        "programdata",
        "perflogs"
    };
    public static string Normalize(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return new string([.. input.Where(char.IsLetterOrDigit)]).ToLower();
    }
    public static int Scoring(string name, string searchingToken, string[] searchWords)
    {
        var cleanName = Normalize(Path.GetFileNameWithoutExtension(name));
        var cleanToken = Normalize(searchingToken);
        var score = 0;
        if (cleanName == cleanToken) score += 20;
        else if (cleanName.Contains(cleanToken)) score += 10;
        if (searchWords.Length > 1)
        {
            var matched = searchWords.Count(w => cleanName.Contains(w));
            score += matched * 2;
            if (matched == searchWords.Length) score += 6;
        }
        if (searchWords.Length > 0 && cleanName.StartsWith(searchWords[0])) score += 1;

        return score;
    }
    public static HashSet<string> ResolveExtensions(ref string searchToken, HashSet<string>? providedExts)
    {
        if (providedExts != null && providedExts.Count > 0)
        {
            return new HashSet<string>(
                providedExts.Select(e => e.StartsWith('.') ? e.ToLower() : "." + e.ToLower()),
                StringComparer.OrdinalIgnoreCase
            );
        }

        var extracted = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var words = searchToken.Split([' ', ',', ';'], StringSplitOptions.RemoveEmptyEntries);
        var cleanWords = new List<string>();

        foreach (var word in words)
        {
            if (word.StartsWith('.') && word.Length is >= 2 and <= 6 && word[1..].All(char.IsLetterOrDigit))
            {
                extracted.Add(word.ToLower());
            }
            else
            {
                var ext = Path.GetExtension(word);
                if (!string.IsNullOrEmpty(ext) && ext.Length is >= 2 and <= 6 && ext[1..].All(char.IsLetterOrDigit))
                {
                    extracted.Add(ext.ToLower());
                    cleanWords.Add(Path.GetFileNameWithoutExtension(word));
                }
                else
                {
                    cleanWords.Add(word);
                }
            }
        }

        if (extracted.Count > 0)
        {
            searchToken = cleanWords.Count > 0 ? string.Join(" ", cleanWords) : "";
        }

        return extracted;
    }

    private static async Task WalkDirectory(
        string currentDir,
        SearchType type,
        string cleanToken,
        string[] searchWords,
        int maxDepth,
        int currentDepth,
        ConcurrentBag<SearchResults> results,
        int candidateLimit,
        ParallelLoopState? state = null,
        HashSet<string>? ignorePaths = null,
        HashSet<string>? extensions = null
    )
    {
        if (currentDepth > maxDepth || results.Count >= candidateLimit || state?.IsStopped == true) return;

        try
        {
            var dirInfo = new DirectoryInfo(currentDir);
            HashSet<string> currentIgnore = ignorePaths ?? IgnoredDirs;
            foreach (var entry in dirInfo.EnumerateFileSystemInfos())
            {
                if (results.Count >= candidateLimit || state?.IsStopped == true) return;
                if (entry.Attributes.HasFlag(FileAttributes.ReparsePoint)) continue;

                string name = entry.Name;
                bool isDir = entry.Attributes.HasFlag(FileAttributes.Directory);
                if (name.StartsWith('.') || name.StartsWith('$') || currentIgnore.Contains(name))
                    continue;

                // Fast-filter by extension if specified
                if (!isDir && extensions != null && extensions.Count > 0)
                {
                    string ext = Path.GetExtension(name);
                    if (string.IsNullOrEmpty(ext) || !extensions.Contains(ext))
                        continue;
                }

                bool matchesType = type switch
                {
                    SearchType.Folder => isDir,
                    SearchType.File => !isDir,
                    _ => true
                };
                string cleanName = isDir ? name : Path.GetFileNameWithoutExtension(name);
                string cleanNorm = Normalize(cleanName);

                // Match either full token OR individual search words (or all files if searching by extension only)
                bool isMatch = string.IsNullOrEmpty(cleanToken)
                    || cleanNorm.Contains(cleanToken)
                    || (searchWords.Length > 0 && searchWords.Any(w => w.Length >= 3 && cleanNorm.Contains(w)));

                if (matchesType && isMatch)
                {
                    results.Add(new SearchResults(name, entry.FullName, isDir ? "Folder" : "File"));
                    if (results.Count >= candidateLimit)
                    {
                        state?.Stop();
                        return;
                    }
                }

                if (isDir && currentDepth < maxDepth)
                {
                    await WalkDirectory(entry.FullName, type, cleanToken, searchWords, maxDepth, currentDepth + 1, results, candidateLimit, state, ignorePaths, extensions);
                }
            }
        }
        catch
        {
            // Ignore inaccessible or locked directories
        }
    }

    public static async Task<List<SearchResults>> Search(
        SearchType type,
        string searchToken,
        int maxResult = 10,
        int maxLimit = 5,
        HashSet<string>? extensions = null) => await Search(type, searchToken, null, maxResult, maxLimit, null, null, extensions);

    public static async Task<List<SearchResults>> Search(
        SearchType type,
        string searchToken,
        string? customPath,
        int maxResult = 10,
        int maxLimit = 5,
        HashSet<string>? directories = null,
        HashSet<string>? ignorePaths = null,
        HashSet<string>? extensions = null)
    {
        Console.WriteLine($"--- SMART SEARCH: {searchToken} ({type}) | Path: {customPath ?? "ALL DRIVES"} ---");
        var results = new ConcurrentBag<SearchResults>();

        var targetExts = ResolveExtensions(ref searchToken, extensions);
        string cleanToken = Normalize(searchToken);
        if (string.IsNullOrWhiteSpace(cleanToken) && targetExts.Count == 0) return [];

        string[] searchWords = searchToken
                   .Split([' ', '_', '-'], StringSplitOptions.RemoveEmptyEntries)
                   .Select(Normalize)
                   .Where(w => w.Length >= 2)
                   .ToArray();

        int candidateLimit = Math.Max(50, maxResult * 3);
        if (!string.IsNullOrWhiteSpace(customPath) && Directory.Exists(customPath))
        {
            await WalkDirectory(customPath, type, cleanToken, searchWords, maxLimit, 0, results, candidateLimit, null, ignorePaths, targetExts);
        }
        else if (directories != null)
        {
            await Parallel.ForEachAsync(directories, async (directory, state) =>
            {
                if (!Directory.Exists(directory)) return;
                await WalkDirectory(directory, type, cleanToken, searchWords, maxLimit, 0, results, candidateLimit, null, ignorePaths, targetExts);
            });
        }
        else
        {
            var drives = DriveInfo.GetDrives();
            await Parallel.ForEachAsync(drives, async (drive, state) =>
            {
                if (!drive.IsReady) return;
                await WalkDirectory(drive.RootDirectory.FullName, type, cleanToken, searchWords, maxLimit, 0, results, candidateLimit, null, null, targetExts);
            });
        }

        var ranked = results
            .DistinctBy(r => r.Path)
            .OrderByDescending(r => Scoring(r.Name, cleanToken, searchWords))
            .Take(maxResult)
            .ToList();

        Console.WriteLine($"Found {ranked.Count} results for '{searchToken}':");
        foreach (var r in ranked)
        {
            Console.WriteLine($"  [{Scoring(r.Name, cleanToken, searchWords)} pts] {r.Name} -> {r.Path}");
        }

        return ranked;
    }

    public static async Task<List<SearchResults>> SearchApp(string appName, int maxResults = 10, string? extension = null)
    {
        if (string.IsNullOrWhiteSpace(appName)) return [];

        HashSet<string> appExts = !string.IsNullOrWhiteSpace(extension)
            ? [extension.StartsWith('.') ? extension : "." + extension]
            : [".exe", ".lnk", ".url"];

        var results = await Search(SearchType.File, appName, null, maxResults, 10, AppTargetPaths, AppIgnorePaths, appExts);
        if (results.Count == 0)
        {
            results = await Search(SearchType.File, appName, null, maxResults, 10, null, null, appExts);
        }
        return results.Take(maxResults).ToList();
    }

}
