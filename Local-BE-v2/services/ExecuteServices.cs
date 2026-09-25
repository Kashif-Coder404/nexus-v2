namespace Nexus.Agent.Services;

using System.Collections.Concurrent;
using System.Diagnostics;
using System.Drawing;
using System.Text;
using System.Text.Json;
using Nexus.Agent.Models;


public static class ExecuteServices
{

    public static readonly ConcurrentDictionary<string, Process> ActiveTasks = new();

    private static async Task OnTaskFinishedAsync(string taskId, int pid, int exitCode, string output)
    {
        ActiveTasks.TryRemove(taskId, out _);
        var payload = new
        {
            type = "task_finished",
            taskId,
            pid,
            exitCode,
            terminalOutput = output.Trim()
        };
        await WebSocketClientService.BroadcastEventAsync(payload);
        Console.WriteLine($"[ExecuteServices] Task {taskId} (PID: {pid}) finished with exit code {exitCode}.");
    }
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        IncludeFields = true,
        WriteIndented = true
    };
    public static async Task<CommandResponse> RunAsync(RunCommandDto body)
    {
        int timeoutSec = body.TimeoutSeconds > 0 ? body.TimeoutSeconds : 30;
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSec));
        // 1. Persona 1: GUI Apps, Folders, & URLs (Wait + Window + Event)

        if (body.ExecutionType == ExecutionTypes.Wait &&
            body.VerifyType == VerifyType.Window &&
            body.OutputMode == OutputMode.Event)
        {
            if (body.Command.TrimStart().StartsWith("explorer", StringComparison.OrdinalIgnoreCase))
            {
                var match = System.Text.RegularExpressions.Regex.Match(body.Command, @"['""]([^'""]+)['""]");
                if (match.Success)
                {
                    string targetPath = match.Groups[1].Value.Trim();
                    if (Path.IsPathRooted(targetPath) && !Directory.Exists(targetPath) && !File.Exists(targetPath))
                    {
                        return new CommandResponse
                        {
                            Cmd = body.Command,
                            Msg = $"Cannot open folder. Path does not exist: {targetPath}",
                            TerminalOutput = "",
                            TerminalError = $"DirectoryNotFoundException: The path '{targetPath}' was not found on this system.",
                            IsSuccess = false,
                            ExitCode = 1
                        };
                    }
                }
            }
            var apppsi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -Command \"{body.Command}\"",
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            var ignored = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "powershell", "cmd", "conhost", "OpenConsole"
            };
            var detectedList = await ProcessLauncher.LaunchAndDetectAsync(apppsi, maxAttempts: 14, ignoredNames: ignored); //14 -> safe side
            bool appFound = detectedList.Count > 0;
            string terminalOutput = appFound
                ? JsonSerializer.Serialize(detectedList, _jsonOptions)
                : "No new application process detected.";


            return new CommandResponse
            {
                Cmd = body.Command,
                Msg = appFound ? $"Started {detectedList.Count} process(es) successfully." : "Fialed to launch application. Process not Found!",
                TerminalOutput = terminalOutput,
                TerminalError = appFound ? "" : "Application executable failed to start or was not found.",
                IsSuccess = appFound,
                ExitCode = appFound ? 0 : 1
            };
        }
        else if (body.ExecutionType == ExecutionTypes.Background &&
                    body.VerifyType == VerifyType.Window &&
                    body.OutputMode == OutputMode.Live)
        {
            var apppsi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoExit -ExecutionPolicy Bypass -Command \"& {{{body.Command}}} \"",
                UseShellExecute = true,
                CreateNoWindow = false,
            };
            var detectedList = await ProcessLauncher.LaunchAndDetectAsync(apppsi, maxAttempts: 6);
            string terminalOutput = detectedList.Count > 0
                    ? JsonSerializer.Serialize(detectedList, _jsonOptions)
                    : "Terminal Window Launched";

            return new CommandResponse
            {
                Cmd = body.Command,
                Msg = detectedList.Count > 0
                    ? $"Started {detectedList.Count} process(es) successfully."
                    : "Terminal window launched.",
                TerminalOutput = terminalOutput,
                TerminalError = "",
                IsSuccess = true,
                ExitCode = 0

            };
        }
        // 3. Persona 3: Silent Headless Daemon (Background + Pid + Live)
        else if (body.ExecutionType == ExecutionTypes.Background &&
                 body.VerifyType == VerifyType.Pid &&
                 body.OutputMode == OutputMode.Live)
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -Command \"{body.Command}\"",
                RedirectStandardOutput = true, // Pipe stdout to our code
                RedirectStandardError = true,  // Pipe stderr to our code
                UseShellExecute = false,
                CreateNoWindow = true,         // 100% silent, 0 window flicker
            };

            var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
            var logBuffer = new System.Text.StringBuilder();
            var errorBuffer = new System.Text.StringBuilder();

            // Hook real-time stdout / stderr streams
            process.OutputDataReceived += (sender, args) =>
            {
                if (args.Data != null)
                {
                    logBuffer.AppendLine(args.Data);
                    Console.WriteLine($"[PID {process.Id}] {args.Data}");
                }
            };
            process.ErrorDataReceived += (sender, args) =>
            {
                if (args.Data != null)
                {
                    errorBuffer.AppendLine(args.Data);
                    Console.WriteLine($"[PID {process.Id}][ERROR] {args.Data}");
                }
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            // 1-second Boot Crash Detection
            await Task.Delay(1000);
            if (process.HasExited)
            {
                // It crashed immediately (e.g. port taken, invalid command)
                return new CommandResponse
                {
                    Cmd = body.Command,
                    Msg = "Process failed to start or exited immediately.",
                    TerminalOutput = logBuffer.ToString().Trim(),
                    TerminalError = errorBuffer.ToString().Trim(),
                    IsSuccess = false,
                    ExitCode = process.ExitCode
                };
            }

            // Process is healthy! Store in ActiveProcess dictionary so we can track or kill it later
            ProcessLauncher.ActiveProcess.TryAdd(process.Id, process);
            process.Exited += (s, e) =>
            {
                ProcessLauncher.ActiveProcess.TryRemove(process.Id, out _);
                process.Dispose();
            };

            return new CommandResponse
            {
                Cmd = body.Command,
                Msg = $"Background process running silently with PID {process.Id}.",
                Pid = process.Id.ToString(),
                TerminalOutput = logBuffer.ToString().Trim(),
                TerminalError = "",
                IsSuccess = true,
                ExitCode = 0
            };
        }        // 4. Persona 4: Synchronous CLI Commands, Installs, & Clones (Wait + None + Final)
        else
        {
            var psi = new ProcessStartInfo
            {
                FileName = "powershell.exe",
                Arguments = $"-NoProfile -NonInteractive -Command \"{body.Command}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = new Process { StartInfo = psi };
            try
            {
                process.Start();
                var outputBuilder = new StringBuilder();
                var errorBuilder = new StringBuilder();
                string? currentTaskId = null;

                process.OutputDataReceived += (s, e) =>
                {
                    if (e.Data != null)
                    {
                        outputBuilder.AppendLine(e.Data);
                        if (currentTaskId != null && ActiveTasks.ContainsKey(currentTaskId))
                        {
                            _ = WebSocketClientService.BroadcastEventAsync(new
                            {
                                type = "cmd_chunk",
                                taskId = currentTaskId,
                                chunk = e.Data + "\n"
                            });
                        }
                    }
                };
                process.ErrorDataReceived += (s, e) =>
                {
                    if (e.Data != null)
                    {
                        errorBuilder.AppendLine(e.Data);
                        if (currentTaskId != null && ActiveTasks.ContainsKey(currentTaskId))
                        {
                            _ = WebSocketClientService.BroadcastEventAsync(new
                            {
                                type = "cmd_chunk",
                                taskId = currentTaskId,
                                chunk = e.Data + "\n"
                            });
                        }
                    }
                };
                process.BeginOutputReadLine();
                process.BeginErrorReadLine();

                // Wait for command to finish (or timeout)
                var exitTask = process.WaitForExitAsync(cts.Token);
                var thresholdTask = Task.Delay(1500);
                var winner = await Task.WhenAny(exitTask, thresholdTask);
                if (winner == exitTask)
                {
                    return new CommandResponse
                    {
                        Cmd = body.Command,
                        Msg = process.ExitCode == 0 ? "Command executed successfully." : "Command failed.",
                        TerminalOutput = outputBuilder.ToString().Trim(),
                        TerminalError = errorBuilder.ToString().Trim(),
                        IsSuccess = process.ExitCode == 0,
                        ExitCode = process.ExitCode
                    };
                }
                else
                {
                    string TaskId = body.TaskId ?? $"task-{process.Id}";
                    currentTaskId = TaskId;
                    ActiveTasks.TryAdd(TaskId, process);
                    _ = exitTask.ContinueWith(async _ => await OnTaskFinishedAsync(TaskId, process.Id, process.ExitCode, outputBuilder.ToString()));
                    return new CommandResponse
                    {
                        Cmd = body.Command,
                        Msg = $"Process running in background (PID: {process.Id}).",
                        Pid = process.Id.ToString(),
                        TaskId = TaskId,
                        IsBackground = true,
                        IsSuccess = true,
                        TerminalOutput = outputBuilder.ToString().Trim()
                    };
                }
            }
            catch (OperationCanceledException)
            {
                // Timeout exceeded! Kill process and ALL child processes
                try { process.Kill(entireProcessTree: true); } catch { }

                return new CommandResponse
                {
                    Cmd = body.Command,
                    Msg = "Command timed out.",
                    TerminalOutput = "",
                    TerminalError = $"Execution exceeded timeout of {timeoutSec} seconds. Process was killed.",
                    IsSuccess = false,
                    ExitCode = -1
                };
            }
        }

    }
}