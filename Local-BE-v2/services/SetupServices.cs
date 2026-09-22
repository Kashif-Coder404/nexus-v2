namespace Nexus.Agent.Services;

using System;
using System.IO;
using System.Diagnostics;
using System.Linq;
using System.Security.Principal;
using Microsoft.VisualBasic;

public static class SetupServices
{
    public const string TaskName = "NexusBackgroundService";

    public static string InstallDir => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "Nexus");
    public static string TargetExePath => Path.Combine(InstallDir, "nexus.exe");
    public static string CurrentExePath => Environment.ProcessPath ?? Environment.GetCommandLineArgs()[0];

    public static bool IsAdministrator()
    {
        using var identity = WindowsIdentity.GetCurrent();
        var principal = new WindowsPrincipal(identity);
        return principal.IsInRole(WindowsBuiltInRole.Administrator);
    }

    public static bool EnsureElevated(string[] args)
    {
        if (IsAdministrator()) return true;

        try
        {
            Console.WriteLine("[*] Requesting Administrator privileges...");
            var psi = new ProcessStartInfo
            {
                FileName = CurrentExePath,
                Arguments = string.Join(" ", args),
                UseShellExecute = true,
                Verb = "runas"
            };

            var process = Process.Start(psi);
            process?.WaitForExit();
            Environment.Exit(process?.ExitCode ?? 0);
            return false;
        }
        catch (System.ComponentModel.Win32Exception)
        {
            Console.WriteLine("\n[!] Administrator privileges were declined or cancelled.");
            Environment.Exit(1);
            return false;
        }
    }

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
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true
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
            string error = proc?.StandardError.ReadToEnd() ?? "";
            proc?.WaitForExit(5000);
            if (proc?.ExitCode == 0)
            {
                Console.WriteLine("[Setup] Registered Windows Startup Task with Highest Privileges.");
            }
            else
            {
                Console.WriteLine($"[!] Failed to register Windows Startup Task (Exit Code: {proc?.ExitCode}). {error}".Trim());
            }
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

            if (!Directory.Exists(InstallDir))
            {
                Directory.CreateDirectory(InstallDir);
            }

            if (!IsInstalled())
            {
                File.Copy(CurrentExePath, TargetExePath, overwrite: true);
                Console.WriteLine("[Setup] Copied binary to " + TargetExePath);
            }
            else
            {
                Console.WriteLine("[Setup] Verified binary at " + TargetExePath);
            }

            AddPath();
            SheduleTask(isRemove: false);

            // Start the installed agent silently in the background with HIGHEST elevation
            try
            {
                var taskProc = Process.Start(new ProcessStartInfo
                {
                    FileName = "schtasks.exe",
                    Arguments = $"/run /tn \"{TaskName}\"",
                    CreateNoWindow = true,
                    UseShellExecute = false
                });
                taskProc?.WaitForExit(3000);

                if (taskProc?.ExitCode != 0)
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = TargetExePath,
                        Arguments = "--service",
                        CreateNoWindow = true,
                        UseShellExecute = false
                    });
                }
            }
            catch
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = TargetExePath,
                    Arguments = "--service",
                    CreateNoWindow = true,
                    UseShellExecute = false
                });
            }

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