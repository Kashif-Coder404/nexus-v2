namespace Nexus.Agent.Services;

using System.Collections.Concurrent;
using System.Data;
using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Nexus.Agent.Models;

public static class ExecuteServices
{
    public static readonly ConcurrentDictionary<string, Process> ActiveTasks = new();
    public static readonly ConcurrentDictionary<string, ConcurrentQueue<string>> TaskLogBuffers = new();
    public static readonly ConcurrentDictionary<string, int> TaskExitCodes = new();

    public static async Task<CommandResponse> RunAsync(RunCommandDto body)
    {
        if (string.IsNullOrWhiteSpace(body.Command))
        {
            return new CommandResponse
            {
                Cmd = "",
                Msg = "Command cannot be empty.",
                IsSuccess = false,
                ExitCode = 1
            };
        }

        // Prefix script with environment configuration:
        // 1. $ProgressPreference = 'SilentlyContinue' suppresses noisy CLIXML progress bars from stderr.
        // 2. $OutputEncoding = UTF-8 ensures full character fidelity.
        // 3. Read-Host shim forwards console prompts to stdout so they stream immediately.
        string fullScript = $@"
$ProgressPreference = 'SilentlyContinue';
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8;
function Read-Host {{ param([Parameter(Position=0)][string]$Prompt) if ($Prompt) {{ [Console]::Out.Write($Prompt + ': ') }}; Microsoft.PowerShell.Utility\Read-Host }}
{body.Command}
";

        byte[] cmdBytes = Encoding.Unicode.GetBytes(fullScript);
        string encodedCmd = Convert.ToBase64String(cmdBytes);

        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -EncodedCommand {encodedCmd}",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            RedirectStandardInput = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        // Universal Unbuffered & Rich Terminal Environment Variables:
        // Guarantees Python, Node.js, and CLI tools never block-buffer in 4KB chunks and retain ANSI colors
        psi.EnvironmentVariables["PYTHONUNBUFFERED"] = "1";
        psi.EnvironmentVariables["FORCE_COLOR"] = "1";
        psi.EnvironmentVariables["GIT_FLUSH"] = "1";
        psi.EnvironmentVariables["CLICOLOR_FORCE"] = "1";
        psi.EnvironmentVariables["TERM"] = "xterm-256color";
        psi.EnvironmentVariables["COLORTERM"] = "truecolor";


        var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        var outputBuilder = new StringBuilder();
        var errorBuilder = new StringBuilder();
        string currentTaskId = body.TaskId ?? "";

        try
        {
            process.Start();
            int pid = process.Id;
            currentTaskId = body.TaskId ?? $"task-{pid}";
            ActiveTasks.TryAdd(currentTaskId, process);
            ProcessLauncher.ActiveProcess.TryAdd(pid, process);
            TaskLogBuffers.TryAdd(currentTaskId, new ConcurrentQueue<string>());
            // Asynchronous chunk-based stream reader: captures raw text & prompts immediately without waiting for \n
            void StartStreamReader(StreamReader reader, StringBuilder builder, bool isError)
            {
                _ = Task.Run(async () =>
                {
                    char[] charBuf = new char[512];
                    try
                    {
                        while (!process.HasExited || !reader.EndOfStream)
                        {
                            int read = await reader.ReadAsync(charBuf, 0, charBuf.Length);
                            if (read == 0) break;

                            string chunk = new string(charBuf, 0, read);
                            if (isError) Console.Write($"Live Error: {chunk}");
                            else Console.Write($"Live Data: {chunk}");

                            builder.Append(chunk);
                            var queue = TaskLogBuffers.GetOrAdd(currentTaskId, _ => new ConcurrentQueue<string>());
                            queue.Enqueue(chunk);
                            while (queue.Count > 200) queue.TryDequeue(out _);

                            _ = WebSocketClientService.BroadcastEventAsync(new
                            {
                                type = "cmd_chunk",
                                taskId = currentTaskId,
                                pid,
                                chunk
                            });
                        }
                    }
                    catch { }
                });
            }

            StartStreamReader(process.StandardOutput, outputBuilder, isError: false);
            StartStreamReader(process.StandardError, errorBuilder, isError: true);
            if (body.IsDaemon)
            {
                return TaskManager("daemon", body.Command, process, currentTaskId, outputBuilder, errorBuilder);
            }

            Task exitTask = process.WaitForExitAsync();
            Task threshold = Task.Delay(1500);
            Task winner = await Task.WhenAny(exitTask, threshold);

            // Wait for completion: If TimeoutSeconds > 0 wait with timeout; otherwise wait indefinitely
            if (winner == exitTask)
            {
                int exitCode = process.ExitCode;
                ActiveTasks.TryRemove(currentTaskId, out _);
                ProcessLauncher.ActiveProcess.TryRemove(pid, out _);
                process.Dispose();

                //early return to not add in task manager
                return new CommandResponse
                {
                    Cmd = body.Command,
                    Msg = exitCode == 0 ? "Command executed successfully." : "Command failed.",
                    TerminalOutput = outputBuilder.ToString().Trim(),
                    TerminalError = errorBuilder.ToString().Trim(),
                    IsSuccess = exitCode == 0,
                    ExitCode = exitCode,
                    Pid = pid.ToString(),
                    TaskId = currentTaskId
                };
            }
            return TaskManager("event", body.Command, process, currentTaskId, outputBuilder, errorBuilder);
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { }
            int pid = 0;
            try { pid = process.Id; } catch { }
            ActiveTasks.TryRemove(currentTaskId, out _);
            if (pid > 0) ProcessLauncher.ActiveProcess.TryRemove(pid, out _);
            process.Dispose();

            return new CommandResponse
            {
                Cmd = body.Command,
                Msg = "Command timed out.",
                TerminalOutput = outputBuilder.ToString().Trim(),
                TerminalError = $"Execution exceeded timeout of {body.TimeoutSeconds} seconds. Process was killed.",
                IsSuccess = false,
                ExitCode = -1,
                Pid = pid > 0 ? pid.ToString() : null,
                TaskId = currentTaskId
            };
        }
        catch (Exception ex)
        {
            try { process.Kill(entireProcessTree: true); } catch { }
            int pid = 0;
            try { pid = process.Id; } catch { }
            ActiveTasks.TryRemove(currentTaskId, out _);
            if (pid > 0) ProcessLauncher.ActiveProcess.TryRemove(pid, out _);
            process.Dispose();

            return new CommandResponse
            {
                Cmd = body.Command,
                Msg = $"Execution error: {ex.Message}",
                TerminalOutput = outputBuilder.ToString().Trim(),
                TerminalError = ex.Message,
                IsSuccess = false,
                ExitCode = 1,
                Pid = pid > 0 ? pid.ToString() : null,
                TaskId = currentTaskId
            };
        }
    }
    public static CommandResponse TaskManager(string Work, string command, Process process, string taskId, StringBuilder outputBuider, StringBuilder errorBuilder)
    {
        int pid = process.Id;
        ActiveTasks.TryAdd(taskId, process);
        ProcessLauncher.ActiveProcess.TryAdd(pid, process);
        _ = WebSocketClientService.BroadcastEventAsync(new
        {
            type = "task_promoted",
            taskId,
            pid,
            cmd = command
        });
        if (Work == "event")
        {
            //Make the process trigger full , means on process exit ----> aware the frontend , basically finite command;
            //Call the taskWatcher here to get code more meaningful
            //Example : npm run install, git clone , winget install, etc

            _ = Task.Run(async () => await TaskWatcher(process, taskId, pid, outputBuider, errorBuilder, isDaemon: false));
        }
        else
        {
            //Not trigger full , means on process exit ----> still aware the frontend (but it get triggered only when the error happens) and run infinitely;
            //Call the taskWatcher here to get code more meaningful
            //Exapmle: npm run dev , ping, etc .
            _ = Task.Run(async () => await TaskWatcher(process, taskId, pid, outputBuider, errorBuilder, isDaemon: true));
        }
        return new CommandResponse
        {
            Cmd = command,
            Msg = Work == "event"
                ? $"Task '{taskId}' is running in the background (PID: {pid}). Live logs are streaming in the Tasks tab."
                : $"Daemon service '{taskId}' started in the background (PID: {pid}). Monitoring in the Tasks tab.",
            TerminalOutput = outputBuider.ToString().Trim(),
            TerminalError = errorBuilder.ToString().Trim(),
            IsSuccess = true,
            ExitCode = null,
            Pid = pid.ToString(),
            TaskId = taskId
        };
    }
    public static async Task TaskWatcher(Process process, string currentTaskId, int pid, StringBuilder outputBuilder, StringBuilder errorBuilder, bool isDaemon)
    {
        try
        {
            await process.WaitForExitAsync();
            await Task.Delay(100);
            int finalExit = process.ExitCode;
            TaskExitCodes[currentTaskId] = finalExit;
            ActiveTasks.TryRemove(currentTaskId, out _);
            ProcessLauncher.ActiveProcess.TryRemove(pid, out _);
            if (isDaemon)
            {
                await WebSocketClientService.BroadcastEventAsync(new
                {
                    type = "daemon_stopped",
                    taskId = currentTaskId,
                    pid,
                    exitCode = finalExit,
                    crashed = finalExit != 0,
                    terminalOutput = outputBuilder.ToString().Trim(),
                    terminalError = errorBuilder.ToString().Trim()
                });
            }
            else
            {
                await WebSocketClientService.BroadcastEventAsync(new
                {
                    type = "task_finished",
                    taskId = currentTaskId,
                    pid,
                    exitCode = finalExit,
                    terminalOutput = outputBuilder.ToString().Trim(),
                    terminalError = errorBuilder.ToString().Trim()
                });
            }
        }
        finally
        {
            process.Dispose();
        }
    }
    public static CommandResponse PeekTask(string taskId, int limit = 50)
    {
        bool isRunning = false;
        int? exitCode = null;
        string? pid = null;
        if (ActiveTasks.TryGetValue(taskId, out var proc))
        {
            try
            {
                pid = proc.Id.ToString();
                isRunning = !proc.HasExited;
                if (!isRunning)
                {
                    exitCode = proc.ExitCode;
                }
            }
            catch
            {
                isRunning = false;
            }
        }
        else if (TaskExitCodes.TryGetValue(taskId, out var cachedExit))
        {
            exitCode = cachedExit;
            isRunning = false;
        }
        string combinedOutput = "";
        if (TaskLogBuffers.TryGetValue(taskId, out var buffer))
        {
            var lastLines = buffer.TakeLast(limit).ToArray();
            combinedOutput = string.Join("", lastLines);
        }
        return new CommandResponse
        {
            TaskId = taskId,
            IsSuccess = true,
            Msg = isRunning ? "Task is still running." : $"Task stopped (Exit code: {exitCode}).",
            TerminalOutput = combinedOutput,
            ExitCode = exitCode,
            Pid = pid
        };


    }

    public static async Task SendTaskInput(string taskId, string input)
    {
        if (ActiveTasks.TryGetValue(taskId, out var process) && !process.HasExited)
        {
            try
            {
                await process.StandardInput.WriteLineAsync(input);
                await process.StandardInput.BaseStream.FlushAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending input to task {taskId}: {ex.Message}");
            }
        }
        else
        {
            throw new InvalidOperationException($"Task {taskId} is not running.");
        }
    }
}