using System.Diagnostics;
using Nexus.Agent.Models;
using System.Text.Json;
using Nexus.Agent.Services;
using System.Collections.Concurrent;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHostedService<WebSocketClientService>();
var app = builder.Build();
var jsonOptions = new JsonSerializerOptions
{
    IncludeFields = true,
    WriteIndented = true
};

app.MapGet("/", () => "Hello from Nexus C# Agent!");

app.MapPost("/test-cmd", async (RunCommandDto body) =>
{
    var response = await ExecuteServices.RunAsync(body);
    return Results.Ok(response);
});

app.MapPost("/kill/{pid:int}", (int pid) =>
{
    if (ProcessLauncher.ActiveProcess.TryRemove(pid, out var proc))
    {
        try { proc.Kill(entireProcessTree: true); } catch { }
        proc.Dispose();
        return Results.Ok(new { success = true, message = $"Process {pid} terminated." });
    }
    return Results.NotFound(new { success = false, message = $"PID {pid} not found in active processes." });
});

app.MapGet("/system-info", () => Results.Content(SystemInfoService.GetSystemInfoJson(), "application/json"));
app.MapGet("/capture-screen", () =>
{
    var (success, base64, msg) = CaptureScreenShots.CaptureScreen();
    return Results.Ok(new { success, imageBase64 = base64, message = msg });
});
app.Run("http://localhost:4100");
