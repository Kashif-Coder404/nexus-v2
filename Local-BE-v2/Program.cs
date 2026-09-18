using System.Diagnostics;
using Nexus.Agent.Models;
using System.Text.Json;
using Nexus.Agent.Services;
using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();
var jsonOptions = new JsonSerializerOptions
{
    IncludeFields = true,
    WriteIndented = true
};
app.MapGet("/", () => "Hello from Nexus C# Agent!");

app.MapPost("/test-cmd", async (RunCommandDto body) =>
{
    // 1. Run PowerShell silently
    int timeoutSec = body.TimeoutSeconds > 0 ? body.TimeoutSeconds : 30;
    using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSec));
    Console.WriteLine($"{body.VerifyType}, {body.ExecutionType}, {body.OutputMode}");
    var apppsi = new ProcessStartInfo();
    //OPENING APPS...
    if (body.ExecutionType == ExecutionTypes.Wait && body.VerifyType == VerifyType.Window && body.OutputMode == OutputMode.Event)

    {

        // Console.WriteLine(beforePids.ToString());
        apppsi = new ProcessStartInfo
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

        var detectedList = await ProcessLauncher.LaunchAndDetectAsync(apppsi, maxAttempts: 6, ignoredNames: ignored);
        bool appFound = detectedList.Count > 0;
        string terminalOutput = detectedList.Count > 0
          ? JsonSerializer.Serialize(detectedList, jsonOptions)
          : "No new application process detected.";

        return Results.Ok(new CommandResponse
        {
            Cmd = body.Command,
            Msg = appFound ? $"Started {detectedList.Count} process(es) successfully." : "Failed to launch application. Process not found.",
            TerminalOutput = terminalOutput,
            TerminalError = appFound ? "" : "Application executable failed to start or was not found.",
            IsSuccess = appFound,
            ExitCode = appFound ? 0 : 1
        });
    }
    //TODO
    if (body.ExecutionType == ExecutionTypes.Background && body.VerifyType == VerifyType.Window && body.OutputMode == OutputMode.Live)
    {

        //TODO: add logic for the live window shown on the web server live terminal  
        apppsi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            // Wrapping in & { ... } forces PowerShell to execute the script block immediately without waiting for an Enter key!
            Arguments = $"-NoExit -ExecutionPolicy Bypass -Command \"& {{ {body.Command} }}\"",
            UseShellExecute = true,
            CreateNoWindow = false,
        };
        var detectedList = await ProcessLauncher.LaunchAndDetectAsync(apppsi, maxAttempts: 6);
        string terminalOutput = detectedList.Count > 0
             ? JsonSerializer.Serialize(detectedList, jsonOptions)
             : "Terminal window launched.";
        return Results.Ok(
            new CommandResponse
            {
                Cmd = body.Command,
                Msg = detectedList.Count > 0 ? $"Started {detectedList.Count} process(es) successfully." : "Application launched.",
                TerminalOutput = terminalOutput,
                TerminalError = "",
                IsSuccess = true,
                ExitCode = 0
            }
        );
    }
    else if (
    body.ExecutionType == ExecutionTypes.Background &&
    body.VerifyType == VerifyType.Pid &&
    body.OutputMode == OutputMode.Live)
    {
        // 1. Start hidden process
        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -Command \"{body.Command}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        var process = new Process { StartInfo = psi, EnableRaisingEvents = true };
        var logBuffer = new System.Text.StringBuilder();
        var errorBuffer = new System.Text.StringBuilder();

        // 2. Capture stdout/stderr asynchronously

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

        await Task.Delay(1000);
        if (process.HasExited)
        {
            // It crashed immediately (e.g. port taken, invalid command)
            return Results.Ok(new CommandResponse
            {
                Cmd = body.Command,
                Msg = "Process failed to start or exited immediately.",
                TerminalOutput = logBuffer.ToString().Trim(),
                TerminalError = errorBuffer.ToString().Trim(),
                IsSuccess = false,
                ExitCode = process.ExitCode
            });
        }
        // 3. Store process in ActiveProcesses
        ProcessLauncher.ActiveProcess.TryAdd(process.Id, process);
        process.Exited += (s, e) =>
        {
            ProcessLauncher.ActiveProcess.TryRemove(process.Id, out _);
            process.Dispose();
        };
        // 4. Return PID immediately
        return Results.Ok(new CommandResponse
        {
            Cmd = body.Command,
            Msg = $"Background process running silently with PID {process.Id}.",
            Pid = process.Id.ToString(),
            TerminalOutput = logBuffer.ToString().Trim(),
            TerminalError = "",
            IsSuccess = true,
            ExitCode = 0
        });
        // 5. Send future logs as events
        // Websocket conection should be made for this step (current using console.logs)
    }
    else
    {
        var psi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -NonInteractive -Command \"{body.Command}\"",
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        using var process = new Process { StartInfo = psi };
        try
        {
            process.Start();
            var outputTask = process.StandardOutput.ReadToEndAsync(cts.Token);
            var errorTask = process.StandardError.ReadToEndAsync(cts.Token);
            await process.WaitForExitAsync(cts.Token);
            string output = await outputTask;
            string error = await errorTask;
            return Results.Ok(new CommandResponse
            {
                Cmd = body.Command,
                Msg = process.ExitCode == 0 ? "Command executed successfully." : "Command failed.",
                TerminalOutput = output.Trim(),
                TerminalError = error.Trim(),
                IsSuccess = process.ExitCode == 0,
                ExitCode = process.ExitCode
            });
        }
        catch (OperationCanceledException)
        {
            try { process.Kill(entireProcessTree: true); } catch { }
            return Results.Ok(new CommandResponse
            {
                Cmd = body.Command,
                Msg = "Command timed out.",
                TerminalOutput = "",
                TerminalError = $"Execution exceeded timeout of {timeoutSec} seconds. Process was killed.",
                IsSuccess = false,
                ExitCode = -1
            });
        }
    }










});

app.Run("http://localhost:4100");
