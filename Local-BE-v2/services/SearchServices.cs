using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Features;
using System.Collections.Concurrent;
using System.Threading.Tasks;
using Microsoft.VisualBasic;
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

    private static async Task WalkDirectory(
        string currentDir,
        SearchType type,
        string cleanToken,
        int maxDepth,
        int currentDepth,
        ConcurrentBag<SearchResults> results,
        int maxResult,
        ParallelLoopState? state = null,
        HashSet<string>? ignorePaths = null
        )
    {
        if (currentDepth > maxDepth || results.Count >= maxResult || state?.IsStopped == true) return;

        try
        {
            var dirInfo = new DirectoryInfo(currentDir);
            HashSet<string> currentIgnore = ignorePaths ?? IgnoredDirs;
            foreach (var entry in dirInfo.EnumerateFileSystemInfos())
            {
                if (results.Count >= maxResult || state?.IsStopped == true) return;

                if (entry.Attributes.HasFlag(FileAttributes.ReparsePoint)) continue;

                string name = entry.Name;
                bool isDir = entry.Attributes.HasFlag(FileAttributes.Directory);
                if (name.StartsWith('.') || name.StartsWith('$') || currentIgnore.Contains(name))
                    continue;

                bool matchesType = type switch
                {
                    SearchType.Folder => isDir,
                    SearchType.File => !isDir,
                    _ => true
                };

                if (matchesType && Normalize(name).Contains(cleanToken))
                {
                    results.Add(new SearchResults(name, entry.FullName, isDir ? "Folder" : "File"));
                    if (results.Count >= maxResult)
                    {
                        state?.Stop();
                        return;
                    }
                }

                if (isDir && currentDepth < maxDepth)
                {
                    await WalkDirectory(entry.FullName, type, cleanToken, maxDepth, currentDepth + 1, results, maxResult, state, ignorePaths);
                }
            }
        }
        catch
        {
            // Ignore inaccessible or locked directories
        }
    }

    public static async Task<List<SearchResults>> Search(SearchType type, string searchToken, int maxResult = 10, int maxLimit = 5) => await Search(type, searchToken, null, maxResult, maxLimit);

    public static async Task<List<SearchResults>> Search(SearchType type, string searchToken, string? customPath, int maxResult = 10, int maxLimit = 5, HashSet<string>? directories = null, HashSet<string>? ignorePaths = null)
    {
        Console.WriteLine($"--- V1-STYLE SMART SEARCH: {searchToken} ({type}) | Path: {customPath ?? "ALL DRIVES"} ---");
        var results = new ConcurrentBag<SearchResults>();
        string cleanToken = Normalize(searchToken);
        if (string.IsNullOrWhiteSpace(cleanToken)) return [];

        if (!string.IsNullOrWhiteSpace(customPath) && Directory.Exists(customPath))
        {
            await WalkDirectory(customPath, type, cleanToken, maxLimit, 0, results, maxResult, null, ignorePaths);
        }
        else if (directories != null)
        {
            await Parallel.ForEachAsync(directories, async (directory, state) =>
            {
                if (!Directory.Exists(directory)) return;
                await WalkDirectory(directory, type, cleanToken, maxLimit, 0, results, maxResult, null, ignorePaths);
            });
        }
        else
        {
            var drives = DriveInfo.GetDrives();

            await Parallel.ForEachAsync(drives, async (drive, state) =>
                        {
                            if (!drive.IsReady) return;
                            await WalkDirectory(drive.RootDirectory.FullName, type, cleanToken, maxLimit, 0, results, maxResult);
                        });
        }

        return [.. results.Take(maxResult)];
    }

    public static async Task<List<SearchResults>> SearchApp(string appName, int maxResults = 10)
    {
        if (string.IsNullOrWhiteSpace(appName)) return [];
        var results = await Search(SearchType.File, appName, null, maxResults, 10, AppTargetPaths, AppIgnorePaths);
        if (results.Count == 0)
        {
            results = await Search(SearchType.File, appName, null, maxResults, 10);
        }
        List<SearchResults> finalResults = [];
        List<string> extensions = [".exe", ".lnk", ".url"];
        foreach (var item in results)
        {
            if (extensions.Contains(Path.GetExtension(item.Path)))
            {
                finalResults.Add(item);
            }
            if (finalResults.Count >= maxResults) break;
        }
        return finalResults;
    }
}
