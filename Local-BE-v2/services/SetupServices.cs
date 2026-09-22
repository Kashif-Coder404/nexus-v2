namespace Nexus.Agent.Services;

using System;
using System.IO;
using System.Diagnostics;
using System.Linq;
using Microsoft.VisualBasic;

public static class SetupServices
{
    public const string TaskName = "NexusBackgroundService";

    public static string InstallDir => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Nexus");
    public static string TargetExePath => Path.Combine(InstallDir, "nexus.exe");
    public static string CurrentExePath => Environment.ProcessPath ?? "";

    public static bool IsInstalled()
    {
        if (string.IsNullOrEmpty(CurrentExePath)) return false;
        return CurrentExePath.Equals(TargetExePath, StringComparison.OrdinalIgnoreCase);
    }
    public static void OpenDashboard()
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = "http://localhost:4100/",
                UseShellExecute = true

            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Setup] Could not open browser: {ex.Message}");
        }
    }
    public static void StopRunningInstances()
    {
        int currentPid = Environment.ProcessId;
        string[] targetNames = ["nexus", "nexus.agent"];

        foreach (var process in Process.GetProcesses())
        {
            try
            {
                if (targetNames.Contains(process.ProcessName.ToLowerInvariant()) && process.Id != currentPid)
                {
                    Console.WriteLine($"[*] Stopping existing process: {process.ProcessName} (PID: {process.Id})");
                    process.Kill();
                    process.WaitForExit(3000);
                }
            }
            catch
            {
                // Process may have already exited or insufficient permissions
            }
        }
    }
    public static void AddPath()
    {
        string newPath = InstallDir;
        var paths = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.User)?.Split(";", StringSplitOptions.RemoveEmptyEntries).ToList();
        if (paths == null) return;
        if (!paths.Contains(newPath, StringComparer.OrdinalIgnoreCase))
        {
            paths.Add(newPath);
            Environment.SetEnvironmentVariable("Path", string.Join(";", paths), EnvironmentVariableTarget.User);
            Console.WriteLine("[Setup] Added Nexus to User PATH.");
        }
    }
    public static void RemovePath()
    {
        string pathToRemove = InstallDir;
        var paths = Environment.GetEnvironmentVariable("Path", EnvironmentVariableTarget.User)?.Split(";", StringSplitOptions.RemoveEmptyEntries).ToList();
        if (paths == null) return;
        paths.RemoveAll(p => p.Equals(pathToRemove, StringComparison.OrdinalIgnoreCase));
        Environment.SetEnvironmentVariable("Path", string.Join(";", paths), EnvironmentVariableTarget.User);
        Console.WriteLine("[Setup] Removed Nexus from User PATH.");
    }
    public static void SheduleTask(bool isRemove = false)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = "schtasks.exe",
                Arguments = "",
                CreateNoWindow = true,
                UseShellExecute = false
            };
            if (isRemove)
            {
                psi.Arguments = $"/delete /tn \"{TaskName}\" /f";
                using var removeProcess = Process.Start(psi);
                removeProcess?.WaitForExit(5000);
                Console.WriteLine("[Setup] Removed Windows Startup Task.");
                return;
            }
            psi.Arguments = $"/create /tn \"{TaskName}\" /tr \"\\\"{TargetExePath}\\\" --service\" /sc onlogon /rl HIGHEST /f";
            using var proc = Process.Start(psi);
            proc?.WaitForExit(5000);
            Console.WriteLine("[Setup] Registered Windows Startup Task.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Setup] Task scheduler error: {ex.Message}");
        }
    }
    public static async Task InstallAsync()
    {
        Console.Clear();
        Console.WriteLine("[*] Preparing installation...");

        try
        {
            StopRunningInstances();
            if (IsInstalled())
            {
                Console.WriteLine("[Nexus] Already installed at: " + TargetExePath);
                Console.WriteLine("Run 'nexus --start' to launch the service, or 'nexus --uninstall' to remove.");
                return;
            }

            if (!Directory.Exists(InstallDir))
            {
                Directory.CreateDirectory(InstallDir);
            }
            if (!IsInstalled())
            {
                File.Copy(CurrentExePath, TargetExePath, overwrite: true);


                // Start the installed agent silently in the background
                Process.Start(new ProcessStartInfo
                {
                    FileName = TargetExePath,
                    Arguments = "--service",
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true
                });
            }

            AddPath();
            SheduleTask(isRemove: false);
            OpenDashboard();

            Console.WriteLine("[SUCCESS] All done! Opening pairing dashboard...");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[!] Installation failed: {ex.Message}");
        }

        await Task.CompletedTask;
    }

    public static async Task UninstallAsync()
    {
        Console.WriteLine("[Nexus] Uninstalling Nexus...");
        try
        {
            StopRunningInstances();
            SheduleTask(isRemove: true);
            RemovePath();
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var nexusPath = Path.Combine(appData, "Nexus");
            if (Directory.Exists(nexusPath))
            {
                Directory.Delete(nexusPath, recursive: true);
            }
            Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c timeout /t 2 /nobreak > nul & rmdir /s /q \"{InstallDir}\"",
                CreateNoWindow = true,
                UseShellExecute = false
            });
            Console.WriteLine("[SUCCESS] Uninstalled successfully!");
            Environment.Exit(0);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[!] Uninstall error: {ex.Message}");
        }
        await Task.CompletedTask;
    }

}