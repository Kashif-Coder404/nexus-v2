using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http.Features;
using System.Collections.Concurrent;
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

    public static string Normalize(string input)
    {
        if (string.IsNullOrEmpty(input)) return string.Empty;
        return new string([.. input.Where(char.IsLetterOrDigit)]).ToLower();
    }

    private static void WalkDirectory(
        string currentDir,
        SearchType type,
        string cleanToken,
        int maxDepth,
        int currentDepth,
        ConcurrentBag<SearchResults> results,
        int maxResult,
        ParallelLoopState? state = null)
    {
        if (currentDepth > maxDepth || results.Count >= maxResult || state?.IsStopped == true) return;

        try
        {
            var dirInfo = new DirectoryInfo(currentDir);

            foreach (var entry in dirInfo.EnumerateFileSystemInfos())
            {
                if (results.Count >= maxResult || state?.IsStopped == true) return;

                if (entry.Attributes.HasFlag(FileAttributes.ReparsePoint)) continue;

                string name = entry.Name;
                bool isDir = entry.Attributes.HasFlag(FileAttributes.Directory);

                if (name.StartsWith('.') || name.StartsWith('$') || IgnoredDirs.Contains(name))
                    continue;

                bool matchesType = type switch
                {
                    SearchType.Folder => isDir,
                    SearchType.File   => !isDir,
                    _                 => true
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
                    WalkDirectory(entry.FullName, type, cleanToken, maxDepth, currentDepth + 1, results, maxResult, state);
                }
            }
        }
        catch
        {
            // Ignore inaccessible or locked directories
        }
    }

    public static List<SearchResults> Search(SearchType type, string searchToken, int maxResult = 10, int maxLimit = 5)
        => Search(type, searchToken, null, maxResult, maxLimit);

    public static List<SearchResults> Search(SearchType type, string searchToken, string? customPath, int maxResult = 10, int maxLimit = 5)
    {
        Console.WriteLine($"🔍 --- V1-STYLE SMART SEARCH: {searchToken} ({type}) | Path: {customPath ?? "ALL DRIVES"} ---");
        var results = new ConcurrentBag<SearchResults>();
        string cleanToken = Normalize(searchToken);
        if (string.IsNullOrWhiteSpace(cleanToken)) return [];

        if (!string.IsNullOrWhiteSpace(customPath) && Directory.Exists(customPath))
        {
            WalkDirectory(customPath, type, cleanToken, maxLimit, 0, results, maxResult, null);
        }
        else
        {
            var drives = DriveInfo.GetDrives();

            Parallel.ForEach(drives, (drive, state) =>
            {
                if (!drive.IsReady) return;
                WalkDirectory(drive.RootDirectory.FullName, type, cleanToken, maxLimit, 0, results, maxResult, state);
            });
        }

        return [.. results.Take(maxResult)];
    }

    public static List<SearchResults> SearchApp(string appName, int maxResults = 10)
    {
        var results = new List<SearchResults>();
        if (string.IsNullOrWhiteSpace(appName)) return results;

        string cleanToken = Normalize(appName);
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var appDirectories = new List<string>
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), @"Microsoft\Windows\Start Menu\Programs"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), @"Microsoft\Windows\Start Menu\Programs"),
            Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
            Environment.GetFolderPath(Environment.SpecialFolder.CommonDesktopDirectory),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Programs")
        };

        var searchOptions = new EnumerationOptions
        {
            IgnoreInaccessible = true,
            RecurseSubdirectories = true,
            MaxRecursionDepth = 4
        };

        var validExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".lnk", ".exe", ".url" };

        foreach (var dir in appDirectories)
        {
            if (!Directory.Exists(dir)) continue;

            var files = Directory.EnumerateFiles(dir, "*", searchOptions);
            foreach (var file in files)
            {
                string ext = Path.GetExtension(file);
                if (!validExtensions.Contains(ext)) continue;

                string appTitle = Path.GetFileNameWithoutExtension(file);

                if (Normalize(appTitle).Contains(cleanToken))
                {
                    if (seen.Add(appTitle))
                    {
                        results.Add(new SearchResults(appTitle, file, "App"));
                        if (results.Count >= maxResults) return results;
                    }
                }
            }
        }

        // If normal shortcut search found results, return them immediately!
        if (results.Count > 0) return results;

        // Fallback: If normal app search failed, automatically search Windows 'shell:AppsFolder' (Store/UWP/MSIX apps)
        try
        {
            Type? shellType = Type.GetTypeFromProgID("Shell.Application");
            if (shellType != null)
            {
                dynamic? shell = Activator.CreateInstance(shellType);
                dynamic? appsFolder = shell?.NameSpace("shell:AppsFolder");
                if (appsFolder != null)
                {
                    foreach (dynamic item in appsFolder.Items())
                    {
                        string name = (string)item.Name;
                        string rawPath = (string)item.Path;
                        if (string.IsNullOrWhiteSpace(name)) continue;

                        if (Normalize(name).Contains(cleanToken))
                        {
                            string launchPath = (rawPath.Contains(@":\") || rawPath.StartsWith(@"\\"))
                                ? rawPath
                                : $@"shell:AppsFolder\{rawPath}";

                            if (seen.Add(name))
                            {
                                results.Add(new SearchResults(name, launchPath, "App"));
                                if (results.Count >= maxResults) return results;
                            }
                        }
                    }
                }
            }
        }
        catch { }

        return results;
    }
}
