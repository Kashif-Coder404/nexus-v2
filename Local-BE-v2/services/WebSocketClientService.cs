namespace Nexus.Agent.Services;

using Nexus.Agent.Models;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using System.Text.Json.Nodes;

public class WebSocketClientService : BackgroundService
{
    private readonly string _backendurl = "ws://localhost:3100";
    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Console.WriteLine("Websocket client service started");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var ws = new ClientWebSocket();
                Console.WriteLine("[WS] Connecting to Cloud Backend...");
                await ws.ConnectAsync(new Uri(_backendurl), stoppingToken);
                string? token = await LoadDeviceTokenAsync();
                if (!string.IsNullOrEmpty(token))
                {
                    Console.WriteLine("🔑 [WS] Found saved device token. Authenticating...");
                    await SendJsonAsync(ws, new { type = "auth", token }, stoppingToken);
                }
                else
                {
                    string pairingCode = "NX-" + Guid.NewGuid().ToString("N")[..4].ToUpper();
                    Console.WriteLine($"🔑 [WS] No device token found. Pairing Code: {pairingCode}");
                    Console.WriteLine($"👉 Enter code '{pairingCode}' in your Nexus Web UI to pair this machine.");
                    await SendJsonAsync(ws, new { type = "PairingInit", code = pairingCode }, stoppingToken);
                }
                Console.WriteLine("✅ [WS] Connected to Cloud Backend!");
                await ReceiveLoopAsync(ws, stoppingToken);

            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                Console.WriteLine($"⚠️ [WS] Backend offline ({ex.Message}). Retrying in 5s...");
                await Task.Delay(5000, stoppingToken);
            }
        }
    }
    private static async Task SendJsonAsync(ClientWebSocket ws, object payload, CancellationToken ct)
    {
        if (ws.State != WebSocketState.Open) return;
        string jsonStr = JsonSerializer.Serialize(payload, _jsonOptions);
        byte[] bytes = Encoding.UTF8.GetBytes(jsonStr);
        await ws.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, ct);
    }
    private static async Task ReceiveLoopAsync(ClientWebSocket ws, CancellationToken ct)
    {
        var buffer = new byte[1024 * 32];

        while (ws.State == WebSocketState.Open && !ct.IsCancellationRequested)
        {
            var ms = new MemoryStream();
            WebSocketReceiveResult result;
            do
            {
                result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), ct);
                if (result.MessageType == WebSocketMessageType.Close) return;
                ms.Write(buffer, 0, result.Count);
            } while (!result.EndOfMessage);

            string raw = Encoding.UTF8.GetString(ms.ToArray());
            if (string.IsNullOrWhiteSpace(raw)) continue;

            try
            {
                var json = JsonNode.Parse(raw);
                string? type = json?["type"]?.GetValue<string>();
                if (type == "PairingSuccess")
                {
                    string? newToken = json?["token"]?.GetValue<string>() ?? json?["deviceToken"]?.GetValue<string>();
                    if (!string.IsNullOrEmpty(newToken))
                    {
                        await SaveDeviceTokenAsync(newToken);
                        Console.WriteLine("🎉 [WS] Pairing confirmed and saved to disk!");
                    }
                }
                if (type == "RunCMD")
                {
                    string? requestId = json?["requestId"]?.GetValue<string>();
                    var cmdNode = json?["cmd"];

                    if (string.IsNullOrEmpty(requestId) || cmdNode == null) continue;

                    Console.WriteLine($"⚡ [WS] Received RunCMD request: {requestId}");

                    RunCommandDto? cmdDto = cmdNode is JsonValue val && val.TryGetValue(out string? str)
                        ? JsonSerializer.Deserialize<RunCommandDto>(str, _jsonOptions)
                        : cmdNode.Deserialize<RunCommandDto>(_jsonOptions);

                    if (cmdDto == null) continue;

                    // Execute through your 4-persona engine!
                    CommandResponse response = await ExecuteServices.RunAsync(cmdDto);

                    // Send back the response!
                    var payload = new
                    {
                        type = "cmd_response",
                        requestId,
                        cmdResponse = response
                    };

                    await SendJsonAsync(ws, payload, ct);
                    Console.WriteLine($"✅ [WS] Sent cmd_response for {requestId} (Success: {response.IsSuccess})");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WS] Error processing message: {ex.Message}");
            }
        }
    }

    private static readonly string ConfigDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Nexus");
    private static readonly string TokenFilePath = Path.Combine(ConfigDir, "deviceToken.json");
    private static async Task<string?> LoadDeviceTokenAsync()
    {
        try
        {
            if (!File.Exists(TokenFilePath)) return null;
            string content = await File.ReadAllTextAsync(TokenFilePath);
            var node = JsonNode.Parse(content);
            return node?["token"]?.GetValue<string>();
        }

        catch { return null; }
    }
    private static async Task SaveDeviceTokenAsync(string token)
    {
        try
        {
            Directory.CreateDirectory(ConfigDir);
            string content = JsonSerializer.Serialize(new { token });
            await File.WriteAllTextAsync(TokenFilePath, content);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WS] Failed to save device token: {ex.Message}");
        }
    }

}