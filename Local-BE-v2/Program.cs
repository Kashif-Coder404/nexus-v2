using System.Diagnostics;
using Nexus.Agent.Models;
using System.Text.Json;
using Nexus.Agent.Services;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHostedService<WebSocketClientService>();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();
app.UseWebSockets();

// 1. Direct P2P LAN WebSocket Stream for Devices.tsx & Local Dashboard
app.Use(async (context, next) =>
{
    if (context.WebSockets.IsWebSocketRequest)
    {
        using var ws = await context.WebSockets.AcceptWebSocketAsync();
        Console.WriteLine("[LOCAL WS] Browser / Client connected directly via LAN!");

        // Handshake welcome message
        var welcomeMsg = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new { message = "Connected to Local-BE!" }));
        await ws.SendAsync(welcomeMsg, WebSocketMessageType.Text, true, CancellationToken.None);

        // Immediately push initial telemetry snapshot
        var initial = Encoding.UTF8.GetBytes(SystemInfoService.GetLiveFeedJson());
        await ws.SendAsync(initial, WebSocketMessageType.Text, true, CancellationToken.None);

        // Stream telemetry every 5 seconds while connected
        while (ws.State == WebSocketState.Open && !context.RequestAborted.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(5000, context.RequestAborted);
                if (ws.State == WebSocketState.Open)
                {
                    var bytes = Encoding.UTF8.GetBytes(SystemInfoService.GetLiveFeedJson());
                    await ws.SendAsync(bytes, WebSocketMessageType.Text, true, CancellationToken.None);
                }
            }
            catch { break; }
        }
        return;
    }
    await next();
});

// 2. Serve Local Pairing Dashboard (setupPage.html)
string htmlPath = Path.Combine(AppContext.BaseDirectory, "setupPage.html");
if (!File.Exists(htmlPath))
{
    htmlPath = Path.Combine(Directory.GetCurrentDirectory(), "setupPage.html");
}

string GetHtmlContent()
{
    if (File.Exists(htmlPath)) return File.ReadAllText(htmlPath);
    try
    {
        using var stream = System.Reflection.Assembly.GetExecutingAssembly().GetManifestResourceStream("Nexus.Agent.setupPage.html");
        if (stream != null)
        {
            using var reader = new StreamReader(stream);
            return reader.ReadToEnd();
        }
    }
    catch { }
    return "<h1>Nexus Agent Running</h1><p>Setup page (setupPage.html) not found in directory.</p>";
}

app.MapGet("/", () => Results.Content(GetHtmlContent(), "text/html"));
app.MapGet("/setup", () => Results.Content(GetHtmlContent(), "text/html"));
app.MapGet("/pairing", () => Results.Content(GetHtmlContent(), "text/html"));

// 3. Status & Pairing Endpoints
app.MapGet("/api/pairing-status", async () =>
{
    string? token = await WebSocketClientService.GetTokenAsync();
    string? code = DeviceStateManager.CurrentPairingCode;
    if (string.IsNullOrEmpty(code) && string.IsNullOrEmpty(token))
    {
        code = DeviceStateManager.GenerateNewPairingCode();
        _ = WebSocketClientService.SendPairingInitAsync();
    }

    return Results.Ok(new
    {
        success = true,
        isConnected = DeviceStateManager.IsConnectedToBackend,
        isPaired = !string.IsNullOrEmpty(token),
        isEnable = DeviceStateManager.IsServiceEnabled,
        code = code,
        expiresat = DeviceStateManager.CodeExpiresAt?.ToString("o"),
        remainingSeconds = DeviceStateManager.RemainingSeconds,
        pairingError = DeviceStateManager.PairingError,
        message = ""
    });
});

app.MapGet("/getParingCode", () =>
{
    string? code = DeviceStateManager.CurrentPairingCode;
    if (string.IsNullOrEmpty(code))
    {
        code = DeviceStateManager.GenerateNewPairingCode();
        _ = WebSocketClientService.SendPairingInitAsync();
    }
    return Results.Ok(new
    {
        success = true,
        hasCode = !string.IsNullOrEmpty(code),
        code = code,
        expiresat = DeviceStateManager.CodeExpiresAt?.ToString("o"),
        remainingSeconds = DeviceStateManager.RemainingSeconds,
        isConnected = DeviceStateManager.IsConnectedToBackend,
        message = ""
    });
});

app.MapGet("/getService", () => Results.Ok(new
{
    success = true,
    isEnable = DeviceStateManager.IsServiceEnabled
}));

app.MapPut("/switch", async (JsonElement body) =>
{
    bool value = body.TryGetProperty("value", out var v) && v.GetBoolean();
    DeviceStateManager.IsServiceEnabled = value;
    await WebSocketClientService.BroadcastStatusAsync(value);
    return Results.Ok(new
    {
        success = true,
        message = "Service switched successfully."
    });
});

app.MapPost("/api/generate-code", async () =>
{
    string code = DeviceStateManager.GenerateNewPairingCode();
    await WebSocketClientService.SendPairingInitAsync();
    return Results.Ok(new
    {
        success = true,
        code = code,
        expiresat = DeviceStateManager.CodeExpiresAt?.ToString("o"),
        remainingSeconds = DeviceStateManager.RemainingSeconds
    });
});

app.MapPost("/api/stop-server", (IHostApplicationLifetime lifetime) =>
{
    _ = Task.Run(async () =>
    {
        await Task.Delay(500);
        lifetime.StopApplication();
    });
    return Results.Ok(new { success = true, message = "Nexus service is stopping..." });
});

app.MapPost("/api/uninstall", async (IHostApplicationLifetime lifetime) =>
{
    await WebSocketClientService.SendRevokeAsync();
    _ = Task.Run(async () =>
    {
        await Task.Delay(500);
        lifetime.StopApplication();
    });
    return Results.Ok(new { success = true, message = "Uninstaller launched successfully." });
});

// 4. Existing Test & Debug Endpoints
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

// Bind to 0.0.0.0 to accept LAN connections from other devices and browsers
app.Run("http://0.0.0.0:4100");
