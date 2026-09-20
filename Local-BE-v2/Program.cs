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

var searchTestResults = SearchServices.Search_ap(SearchType.Both, "index.html", 100, 100);
Console.WriteLine($"Found : {searchTestResults.Count}");

Console.WriteLine(JsonSerializer.Serialize(searchTestResults, jsonOptions));
app.Run("http://localhost:4100");
