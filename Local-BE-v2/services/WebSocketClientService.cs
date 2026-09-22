namespace Nexus.Agent.Services;

using Nexus.Agent.Models;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;
using System.Text.Json.Nodes;

public class WebSocketClientService : BackgroundService
{
#if DEBUG
    private readonly string _backendurl =  "ws://localhost:3100";
#else
    private readonly string _backendurl =  "wss://nexus-v2-e38m.onrender.com";
#endif
    private static readonly JsonSerializerOptions _jsonOptions = new() { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    private static ClientWebSocket? _activeWs;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        Console.WriteLine("Websocket client service started");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var ws = new ClientWebSocket();
                _activeWs = ws;
                Console.WriteLine("[WS] Connecting to Cloud Backend...");
                await ws.ConnectAsync(new Uri(_backendurl), stoppingToken);
                DeviceStateManager.IsConnectedToBackend = true;

                string? token = await LoadDeviceTokenAsync();
                if (!string.IsNullOrEmpty(token))
                {
                    Console.WriteLine("[WS] Found saved device token. Authenticating...");
                    await SendJsonAsync(ws, new
                    {
                        type = "auth",
                        token,
                        ipAddress = DeviceStateManager.GetLocalIpAddress(),
                        service = DeviceStateManager.IsServiceEnabled
                    }, stoppingToken);
                    await SendJsonAsync(ws, new
                    {
                        type = "device_status",
                        service = DeviceStateManager.IsServiceEnabled,
                        ipAddress = DeviceStateManager.GetLocalIpAddress()
                    }, stoppingToken);
                    Console.WriteLine($"[WS] Broadcasted device_status (IP: {DeviceStateManager.GetLocalIpAddress()})");
                }
                else
                {
                    string pairingCode = DeviceStateManager.GenerateNewPairingCode();
                    Console.WriteLine($"[WS] No device token found. Pairing Code: {pairingCode}");
                    Console.WriteLine($"[WS] Enter code '{pairingCode}' in your Nexus Web UI to pair this machine.");
                    await SendJsonAsync(ws, new { type = "PairingInit", code = pairingCode }, stoppingToken);
                }
                Console.WriteLine("[WS] Connected to Cloud Backend!");
                await ReceiveLoopAsync(ws, stoppingToken);

            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                DeviceStateManager.IsConnectedToBackend = false;
                _activeWs = null;
                Console.WriteLine($"[WS] Backend offline ({ex.Message}). Retrying in 5s...");
                await Task.Delay(5000, stoppingToken);
            }
            finally
            {
                DeviceStateManager.IsConnectedToBackend = false;
                _activeWs = null;
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
                        DeviceStateManager.ClearPairingCode();
                        DeviceStateManager.PairingError = "";
                        Console.WriteLine("[WS] Pairing confirmed and saved to disk!");
                        await SendJsonAsync(ws, new
                        {
                            type = "device_status",
                            service = DeviceStateManager.IsServiceEnabled,
                            ipAddress = DeviceStateManager.GetLocalIpAddress()
                        }, ct);
                        Console.WriteLine($"[WS] Broadcasted device_status after pairing (IP: {DeviceStateManager.GetLocalIpAddress()})");
                    }
                }
                else if (type == "PairingFailed")
                {
                    string errMsg = json?["message"]?.GetValue<string>() ?? "Pairing failed";
                    Console.WriteLine($"[WS] Pairing failed: {errMsg}");
                    DeviceStateManager.PairingError = errMsg;
                    await SaveDeviceTokenAsync("");
                    string freshCode = DeviceStateManager.GenerateNewPairingCode();
                    await SendJsonAsync(ws, new { type = "PairingInit", code = freshCode }, ct);
                }
                else if (type == "RevokeResponse")
                {
                    Console.WriteLine("[WS] Device revoke confirmed by cloud backend");
                    await SaveDeviceTokenAsync("");
                    string freshCode = DeviceStateManager.GenerateNewPairingCode();
                    await SendJsonAsync(ws, new { type = "PairingInit", code = freshCode }, ct);
                }

                // Command Processing...
                var cmdNode = json?["cmd"];
                if (cmdNode is JsonValue val && val.TryGetValue(out string? rawStr))
                {
                    try
                    {
                        cmdNode = JsonNode.Parse(rawStr) ?? cmdNode;
                    }
                    catch { }
                }
                string action = cmdNode?["action"]?.GetValue<string>()?.ToLowerInvariant() ?? "";
                string rawCmd = cmdNode?.ToJsonString() ?? "";
                CommandResponse? response = null;
                string? requestId = json?["requestId"]?.GetValue<string>();

                if (string.IsNullOrEmpty(requestId) || cmdNode == null) continue;

                Console.WriteLine($"[WS] Received RunCMD request: {requestId}");
                if (type == "RunCMD")
                {
                    if (!DeviceStateManager.IsServiceEnabled)
                    {
                        var disabledResponse = new CommandResponse
                        {
                            Cmd = rawCmd,
                            Msg = "Command execution is disabled on this device.",
                            TerminalOutput = "Execution failed as user stopped the service to execute commands.",
                            TerminalError = "Command execution disabled",
                            IsSuccess = false,
                            ExitCode = 1
                        };
                        var disabledPayload = new
                        {
                            type = "cmd_response",
                            requestId,
                            cmdResponse = disabledResponse
                        };
                        await SendJsonAsync(ws, disabledPayload, ct);
                        continue;
                    }

                    switch (action)
                    {
                        case "system_info":
                            string infoJson = SystemInfoService.GetSystemInfoJson();
                            response = new CommandResponse
                            {
                                Cmd = rawCmd,
                                Msg = "System info retrieved",
                                TerminalOutput = infoJson,
                                IsSuccess = true,
                                ExitCode = 0
                            };
                            break;
                        case "capture_screen":
                            var (success, base64, msg) = CaptureScreenShots.CaptureScreen();
                            response = new CommandResponse
                            {
                                Cmd = rawCmd,
                                Msg = success ? "Screenshot Captured" : msg,
                                TerminalOutput = success ? "ScreenShot Captured" : "",
                                TerminalError = success ? "" : msg,
                                IsSuccess = success,
                                ExitCode = success ? 0 : 1,
                                ImageBase64 = success ? base64 : null
                            };
                            break;
                        case "search":
                            var searchParam = cmdNode["param"];
                            bool isDeepSearch = searchParam?["isDeepSearch"]?.GetValue<bool>() ?? false;
                            int maxDepth = isDeepSearch ? 8 : 4;

                            string query = searchParam?["expected_name"]?.GetValue<string>() ?? searchParam?["name"]?.GetValue<string>() ?? "";
                            string customPath = searchParam?["path"]?.GetValue<string>() ?? "";
                            string typeStr = searchParam?["type"]?.GetValue<string>()?.ToLowerInvariant() ?? "both";
                            SearchType sType = typeStr switch
                            {
                                "folder" => SearchType.Folder,
                                "file" => SearchType.File,
                                _ => SearchType.Both
                            };
                            var searchResults = SearchServices.Search(sType, query, string.IsNullOrWhiteSpace(customPath) ? null : customPath, maxResult: 10, maxLimit: maxDepth);
                            response = new CommandResponse
                            {
                                Cmd = rawCmd,
                                Msg = $"Found {searchResults.Count} items",
                                TerminalOutput = JsonSerializer.Serialize(searchResults, _jsonOptions),
                                IsSuccess = searchResults.Count > 0,
                                ExitCode = 0
                            };

                            break;
                        case "search_app":
                            var appParam = cmdNode?["param"];
                            string appName = appParam?["name"]?.GetValue<string>()
                                          ?? appParam?["appName"]?.GetValue<string>()
                                          ?? "";
                            var appResults = SearchServices.SearchApp(appName);
                            response = new CommandResponse
                            {
                                Cmd = rawCmd,
                                Msg = $"Found {appResults.Count} apps",
                                TerminalOutput = JsonSerializer.Serialize(appResults, _jsonOptions),
                                IsSuccess = appResults.Count > 0,
                                ExitCode = 0
                            };
                            break;
                        case "in_built":
                        default:
                            RunCommandDto? cmdDto = null;
                            var inBuiltParam = cmdNode?["param"];

                            if (inBuiltParam is JsonValue pVal && pVal.TryGetValue(out string? cmdStr))
                            {
                                cmdDto = new RunCommandDto { Command = cmdStr };
                            }
                            else if (inBuiltParam != null)
                            {
                                cmdDto = inBuiltParam.Deserialize<RunCommandDto>(_jsonOptions);
                            }

                            if (cmdDto == null || string.IsNullOrWhiteSpace(cmdDto.Command))
                            {
                                cmdDto = cmdNode?.Deserialize<RunCommandDto>(_jsonOptions);
                            }

                            if (cmdDto == null || string.IsNullOrWhiteSpace(cmdDto.Command)) continue;

                            response = await ExecuteServices.RunAsync(cmdDto);
                            break;
                    }

                    if (response != null)
                    {
                        var payload = new
                        {
                            type = "cmd_response",
                            requestId,
                            cmdResponse = response
                        };
                        await SendJsonAsync(ws, payload, ct);
                        Console.WriteLine($"[WS] Sent cmd_response for {requestId} (Success: {response.IsSuccess})");
                    }
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

    public static async Task BroadcastStatusAsync(bool isServiceEnabled)
    {
        if (_activeWs == null || _activeWs.State != WebSocketState.Open) return;
        await SendJsonAsync(_activeWs, new
        {
            type = "device_status",
            service = isServiceEnabled,
            ipAddress = DeviceStateManager.GetLocalIpAddress()
        }, CancellationToken.None);
        Console.WriteLine($"[WS] Broadcasted device_status (service={isServiceEnabled})");
    }

    public static async Task SendPairingInitAsync()
    {
        if (_activeWs == null || _activeWs.State != WebSocketState.Open) return;
        string code = DeviceStateManager.CurrentPairingCode ?? DeviceStateManager.GenerateNewPairingCode();
        await SendJsonAsync(_activeWs, new { type = "PairingInit", code }, CancellationToken.None);
        Console.WriteLine($"[WS] Sent PairingInit with code: {code}");
    }

    public static async Task SendRevokeAsync()
    {
        string? token = await LoadDeviceTokenAsync();
        if (_activeWs != null && _activeWs.State == WebSocketState.Open && !string.IsNullOrEmpty(token))
        {
            await SendJsonAsync(_activeWs, new { type = "revoke-device", deviceToken = token }, CancellationToken.None);
            Console.WriteLine("[WS] Sent revoke-device to cloud backend");
        }
        await DeleteTokenAsync();
    }

    public static Task<string?> GetTokenAsync() => LoadDeviceTokenAsync();

    public static Task DeleteTokenAsync()
    {
        try
        {
            if (File.Exists(TokenFilePath))
            {
                File.Delete(TokenFilePath);
                Console.WriteLine("[WS] Deleted local device token file.");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WS] Failed to delete token file: {ex.Message}");
        }
        return Task.CompletedTask;
    }

}