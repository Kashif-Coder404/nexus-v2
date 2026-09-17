using System.Diagnostics;
using Nexus.Agent.Models;
using System.Text.Json;

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
    if (body.VerifyType == VerifyType.Window)
    {
        var beforePids = Process.GetProcesses().Select(p => p.Id).ToHashSet<int>();
        // Console.WriteLine(beforePids.ToString());
        var appPsi = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            Arguments = $"-NoProfile -Command \"{body.Command}\"",
            UseShellExecute = false
        };
        using var launcher = Process.Start(appPsi);
        var detectedList = new List<(string Name, int Pid, string Title)>();

        for (int i = 0; i < 14; i++)
        {
            await Task.Delay(500);
            var currentPids = Process.GetProcesses().Select(p => p.Id).ToHashSet();
            var newPids = currentPids.Except(beforePids).ToList();
            foreach (int pid in newPids)
            {
                try
                {
                    Process processx = Process.GetProcessById(pid);
                    // Skip temporary launcher shells
                    if (processx.ProcessName == "powershell" ||
                        processx.ProcessName == "cmd" ||
                        processx.ProcessName == "conhost" ||
                        processx.ProcessName == "OpenConsole")
                    {
                        continue;
                    }
                    // Add if not already in our list
                    if (!detectedList.Any(d => d.Pid == processx.Id))
                    {
                        detectedList.Add((processx.ProcessName, processx.Id, processx.MainWindowTitle));
                    }
                }
                catch (ArgumentException) { }
            }

            if (detectedList.Count > 0)
            {
                break;
            }
        }
        string terminalOutput = detectedList.Count > 0
          ? JsonSerializer.Serialize(detectedList, jsonOptions)
          : "No new application process detected.";

        return Results.Ok(new CommandResponse
        {
            Cmd = body.Command,
            Msg = detectedList.Count > 0 ? $"Started {detectedList.Count} process(es) successfully." : "Application launched.",
            TerminalOutput = terminalOutput,
            TerminalError = "",
            IsSuccess = true,
            ExitCode = 0
        });
    }




    var psi = new ProcessStartInfo
    {
        FileName = "powershell.exe",
        Arguments = $"-NoProfile -NonInteractive -Command \"{body.Command}\"",
        RedirectStandardOutput = true,
        RedirectStandardError = true,
        UseShellExecute = false,
        CreateNoWindow = false,
    };
    var process = new Process { StartInfo = psi };

    try
    {
        process.Start();
        var outputTask = process.StandardOutput.ReadToEndAsync(cts.Token);
        var errorTask = process.StandardError.ReadToEndAsync(cts.Token);
        await process.WaitForExitAsync(cts.Token);
        string output = await outputTask;
        string error = await errorTask;
        return Results.Ok(
            new CommandResponse
            {
                Cmd = body.Command,
                Msg = process.ExitCode == 0 ? "Command executed successfully." : "Command Failed.",
                TerminalOutput = output.Trim(),
                TerminalError = error.Trim(),
                IsSuccess = process.ExitCode == 0,
                ExitCode = process.ExitCode
            }
        );
    }
    catch (OperationCanceledException)
    {
        try { process.Kill(entireProcessTree: true); } catch { }
        return Results.Ok(
            new CommandResponse
            {
                Cmd = body.Command,
                Msg = "Command timed out.",
                TerminalOutput = "",
                TerminalError = $"Execution exceeded timeout of {timeoutSec} seconds. Process was killed.",
                IsSuccess = false,
                ExitCode = -1
            }
        );

    }
});

app.Run("http://localhost:4100");
